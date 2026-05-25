import Payment from '../models/Payment.js';
import User from '../models/User.js';
import PaymentSettings from '../models/PaymentSettings.js';
import fawaterkConfig from '../config/fawaterk.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

async function getEffectivePaymentPackageSettings() {
    const settingsDoc = await PaymentSettings.findOne({ key: 'payment_packages' }).lean();

    const firstTimePrice = settingsDoc?.firstTime?.price;
    const firstTimeForms = settingsDoc?.firstTime?.formsPerPackage;
    const followUpPrice = settingsDoc?.followUp?.price;
    const followUpForms = settingsDoc?.followUp?.formsPerPackage;

    return {
        firstTime: {
            price: typeof firstTimePrice === 'number' ? firstTimePrice : fawaterkConfig.firstTimePackagePrice,
            formsPerPackage: typeof firstTimeForms === 'number' ? firstTimeForms : fawaterkConfig.firstTimeFormsPerPackage
        },
        followUp: {
            price: typeof followUpPrice === 'number' ? followUpPrice : fawaterkConfig.followUpPackagePrice,
            formsPerPackage: typeof followUpForms === 'number' ? followUpForms : fawaterkConfig.followUpFormsPerPackage
        },
        firstTimeResetEnabled: settingsDoc?.firstTimeResetEnabled === true,
        firstTimeResetAfterDays: typeof settingsDoc?.firstTimeResetAfterDays === 'number'
            ? settingsDoc.firstTimeResetAfterDays
            : 60,
        currency: fawaterkConfig.currency
    };
}

function isFirstTimeEligible({ lastPaidAt, resetEnabled, resetAfterDays }) {
    if (!lastPaidAt) return true;
    if (!resetEnabled) return false;
    const ms = resetAfterDays * 24 * 60 * 60 * 1000;
    return (Date.now() - new Date(lastPaidAt).getTime()) > ms;
}

/**
 * Create a payment invoice using Fawaterk's API
 * POST /api/payments/create-intention
 */
export async function createPaymentIntention(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const effectiveSettings = await getEffectivePaymentPackageSettings();

        // Determine whether this should be treated as first-time vs follow-up
        const lastPaidPayment = await Payment.findOne({ user: userId, status: 'paid' })
            .sort({ paidAt: -1, createdAt: -1 })
            .select('paidAt createdAt')
            .lean();

        const lastPaidAt = lastPaidPayment?.paidAt || lastPaidPayment?.createdAt || null;
        const eligibleForFirstTime = isFirstTimeEligible({
            lastPaidAt,
            resetEnabled: effectiveSettings.firstTimeResetEnabled,
            resetAfterDays: effectiveSettings.firstTimeResetAfterDays
        });

        const inferredPackageType = eligibleForFirstTime ? 'first_time' : 'follow_up';

        // Allow the client to request a specific packageType, but enforce separation rules
        const requestedPackageType = req.body?.packageType;
        const packageType = requestedPackageType || inferredPackageType;

        if (packageType !== 'first_time' && packageType !== 'follow_up') {
            return res.status(400).json({ error: 'Invalid packageType' });
        }

        // Enforce separation rules
        if (!eligibleForFirstTime && packageType === 'first_time') {
            return res.status(400).json({ error: 'First-time package is not available for your account right now' });
        }
        if (eligibleForFirstTime && packageType === 'follow_up' && !lastPaidAt) {
            return res.status(400).json({ error: 'Follow-up package is only available after your first successful payment' });
        }

        // Generate unique reference for this payment
        const cartId = `CARINA-${packageType}-${userId}-${Date.now()}`;

        // Get amount (Fawaterk expects amount in main currency unit, not cents)
        const amount = packageType === 'first_time'
            ? effectiveSettings.firstTime.price
            : effectiveSettings.followUp.price;

        const formsPerPackage = packageType === 'first_time'
            ? effectiveSettings.firstTime.formsPerPackage
            : effectiveSettings.followUp.formsPerPackage;

        // Prepare customer data
        const customerData = {
            first_name: user.name.split(' ')[0] || 'User',
            last_name: user.name.split(' ').slice(1).join(' ') || '',
            email: user.email,
            phone: user.phoneNumber || '01000000000',
            address: 'Cairo, Egypt'
        };

        // Prepare cart items
        const cartItems = [
            {
                name: packageType === 'first_time' ? 'Form Credits Package (First-time)' : 'Form Credits Package (Follow-up)',
                price: amount,
                quantity: 1
            }
        ];

        // Prepare the invoice request body
        const invoiceBody = {
            payment_method_id: 2, // Card payments
            cartTotal: amount.toString(),
            currency: fawaterkConfig.currency,
            customer: customerData,
            cartItems: cartItems,
            redirectionUrls: {
                successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
                failUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed`,
                pendingUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/pending`
            },
            webhookUrl: `${process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace(':5173', ':5000') || 'http://localhost:5000'}/api/payments/callback`,
            cartId: cartId
        };

        // Make request to Fawaterk API
        const response = await fetch(`${fawaterkConfig.baseUrl}${fawaterkConfig.invoiceEndpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${fawaterkConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceBody)
        });

        const invoiceData = await response.json();

        if (!response.ok || invoiceData.status !== 'success') {
            console.error('Fawaterk invoice error:', invoiceData);
            return res.status(response.status).json({ 
                error: 'Failed to create payment invoice',
                details: invoiceData
            });
        }

        // Create payment record in database
        const payment = new Payment({
            user: userId,
            packageType,
            fawaterkInvoiceId: invoiceData.data.invoice_id.toString(),
            fawaterkInvoiceKey: invoiceData.data.invoice_key,
            amount: amount * 100, // Store in cents for consistency
            currency: fawaterkConfig.currency,
            formCredits: formsPerPackage,
            status: 'pending'
        });

        await payment.save();

        // Return the necessary data for frontend
        res.status(201).json({
            success: true,
            payment: {
                id: payment._id,
                packageType,
                invoiceId: invoiceData.data.invoice_id,
                amount: amount,
                currency: fawaterkConfig.currency,
                formsCount: formsPerPackage
            },
            // Fawaterk payment URL for redirecting users
            checkoutUrl: invoiceData.data.payment_data.redirectTo
        });

    } catch (error) {
        console.error('Payment invoice error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

/**
 * Fawaterk callback/webhook handler
 * POST /api/payments/callback
 */
export async function handlePaymentCallback(req, res) {
    try {
        console.log('--- FW Webhook Triggered ---');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        // Check body and fallback to query if necessary
        let callbackData = req.body;
        if (!callbackData || Object.keys(callbackData).length === 0) {
            console.log('req.body is empty. Checking req.query...');
            callbackData = req.query;
        }

        console.log('Fawaterk callback data:', JSON.stringify(callbackData, null, 2));

        if (!callbackData || Object.keys(callbackData).length === 0) {
            console.error('No data received in webhook');
            return res.status(400).json({ error: 'No data received' });
        }

        // Verify webhook signature if secret is configured
        if (fawaterkConfig.webhookSecret) {
            const receivedSignature = req.headers['x-fawaterk-signature'];
            if (receivedSignature) {
                const isValid = verifyWebhookSignature(callbackData, receivedSignature);
                if (!isValid) {
                    console.error('Invalid webhook signature');
                    return res.status(400).json({ error: 'Invalid webhook signature' });
                }
            }
        }

        // Extract transaction details from Fawaterk callback
        // Fawaterk may send status in different field names depending on the callback type
        const invoiceId = callbackData.invoice_id || callbackData.invoiceId;
        const invoiceKey = callbackData.invoice_key || callbackData.invoiceKey;
        const paymentStatus = callbackData.invoice_status || callbackData.paymentStatus || 
                              callbackData.status || callbackData.status_text;
        const transactionId = callbackData.transaction_id || callbackData.transactionId;

        console.log(`Webhook received for invoice ${invoiceId}: status=${paymentStatus}, transactionId=${transactionId}`);

        // Find the payment by invoice ID
        let payment = await Payment.findOne({ fawaterkInvoiceId: invoiceId?.toString() });
        
        if (!payment && invoiceKey) {
            payment = await Payment.findOne({ fawaterkInvoiceKey: invoiceKey });
        }

        if (!payment) {
            console.error('Payment not found for invoice:', invoiceId);
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Map Fawaterk status to our status
        const statusLower = paymentStatus?.toLowerCase();
        
        if (statusLower === 'paid' || statusLower === 'success' || statusLower === 'successful') {
            // Use findOneAndUpdate to atomically update and check if it was already paid
            // This prevents race conditions with the frontend status check
            const updatedPayment = await Payment.findOneAndUpdate(
                { _id: payment._id, status: { $ne: 'paid' } },
                {
                    status: 'paid',
                    paidAt: new Date(),
                    paymentMethod: callbackData.payment_method || 'card',
                    fawaterkTransactionId: transactionId,
                    callbackData: callbackData,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (updatedPayment) {
                // Only add credits if we successfully transitioned status
                const user = await User.findOneAndUpdate(
                            { _id: payment.user },
                            { $inc: { formCredits: payment.formCredits } },
                            { new: true }
                        );
                if (user) {
                    //user.formCredits = (user.formCredits || 0) + payment.formCredits;
                    //await user.save();
                    console.log(`Added ${payment.formCredits} form credits to user ${user._id}. New total: ${user.formCredits}`);
                }
                
                // Return success with updated status
                return res.status(200).json({ success: true, status: 'paid' });
            } else {
                // Payment was already paid (concurrent update)
                return res.status(200).json({ success: true, status: 'paid', message: 'Already processed' });
            }
        } 
        
        // For other statuses, we can update normally as they don't add credits
        // Update general fields first
        payment.fawaterkTransactionId = transactionId;
        payment.callbackData = callbackData;
        payment.updatedAt = new Date();

        if (statusLower === 'pending' || statusLower === 'processing') {
            payment.status = 'pending';
        } else if (statusLower === 'refunded') {
            // Use atomic update to prevent race conditions on refund
            const wasRefunded = await Payment.findOneAndUpdate(
                { _id: payment._id, status: 'paid' },
                { 
                    status: 'refunded',
                    fawaterkTransactionId: transactionId,
                    callbackData: callbackData,
                    updatedAt: new Date()
                },
                { new: true }
            );
            
            if (wasRefunded) {
                // Only deduct credits if we successfully transitioned from paid to refunded
                const user = await User.findOneAndUpdate(
                    { _id: payment.user },
                    { $inc: { formCredits: -payment.formCredits } },
                    { new: true }
                );
                if (user) {
                    console.log(`Refunded ${payment.formCredits} credits from user ${user._id}. New total: ${user.formCredits}`);
                    // Ensure credits don't go negative
                    if (user.formCredits < 0) {
                        await User.findByIdAndUpdate(user._id, { formCredits: 0 });
                        console.log(`Corrected negative credits for user ${user._id}`);
                    }
                }
                return res.status(200).json({ success: true, status: 'refunded' });
            } else if (payment.status === 'refunded') {
                // Already refunded
                return res.status(200).json({ success: true, status: 'refunded', message: 'Already refunded' });
            }
            // If wasn't paid, just update to refunded without credit adjustment
            payment.status = 'refunded';
        } else if (statusLower === 'failed' || statusLower === 'declined' || statusLower === 'expired' || statusLower === 'canceled' || statusLower === 'cancelled') {
            payment.status = 'failed';
            payment.errorMessage = callbackData.message || callbackData.error || 'Payment failed';
            console.log(`Payment ${payment._id} marked as failed. Reason: ${payment.errorMessage}`);
        } else if (!statusLower) {
            // No status provided - log and keep current status
            console.warn(`Webhook received for payment ${payment._id} without status. Keeping current: ${payment.status}`);
            console.warn('Callback data:', JSON.stringify(callbackData, null, 2));
            return res.status(200).json({ success: true, status: payment.status, message: 'No status in callback' });
        } else {
            // Unknown status - log warning but don't auto-fail
            console.warn(`Unknown payment status received: "${paymentStatus}" for payment ${payment._id}`);
            console.warn('Full callback data:', JSON.stringify(callbackData, null, 2));
            // Store the callback data for manual review but don't change status
            payment.callbackData = callbackData;
            payment.updatedAt = new Date();
            await payment.save();
            return res.status(200).json({ success: true, status: payment.status, message: `Unknown status: ${paymentStatus}` });
        }

        await payment.save();

        // Return success to Fawaterk
        res.status(200).json({ success: true, status: payment.status });

    } catch (error) {
        console.error('Callback processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Handle payment redirection callback (GET request from user's browser)
 * GET /api/payments/redirect-callback
 */
export async function handleRedirectCallback(req, res) {
    try {
        const { 
            invoice_id: invoiceId,
            invoice_key: invoiceKey,
            payment_status: paymentStatus,
        } = req.query;

        const statusLower = paymentStatus?.toLowerCase();
        const isSuccess = statusLower === 'paid' || statusLower === 'success' || statusLower === 'successful';
        const isPending = statusLower === 'pending' || statusLower === 'processing';

        // Find the payment
        let payment = null;
        if (invoiceId) {
            payment = await Payment.findOne({ fawaterkInvoiceId: invoiceId.toString() });
        }
        if (!payment && invoiceKey) {
            payment = await Payment.findOne({ fawaterkInvoiceKey: invoiceKey });
        }

        if (payment && isSuccess) {
            // Payment successful - redirect to success page
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?payment_id=${payment._id}`);
        } else if (payment && isPending) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/pending?payment_id=${payment._id}`);
        } else {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=payment_failed`);
        }

    } catch (error) {
        console.error('Redirect callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=server_error`);
    }
}

/**
 * Get payment status - also verifies with Fawaterk API
 * GET /api/payments/:paymentId/status
 */
export async function getPaymentStatus(req, res) {
    try {
        const { paymentId } = req.params;
        const userId = req.user._id;

        // Try to find payment by _id or by invoice_id
        let payment = null;
        
        if (mongoose.isValidObjectId(paymentId)) {
            payment = await Payment.findOne({ _id: paymentId, user: userId });
        }
        
        if (!payment) {
            // Try finding by invoice_id if the paymentId looks like an invoice_id
            payment = await Payment.findOne({ fawaterkInvoiceId: paymentId.toString(), user: userId });
        }

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Optionally verify with Fawaterk API for pending payments
        if (payment.status === 'pending' && payment.fawaterkInvoiceId) {
            console.log(`Verifying pending payment ${payment._id} (Invoice: ${payment.fawaterkInvoiceId}) with Fawaterk...`);
            try {
                const response = await fetch(
                    `${fawaterkConfig.baseUrl}${fawaterkConfig.paymentStatusEndpoint}${payment.fawaterkInvoiceId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${fawaterkConfig.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const statusData = await response.json();
                console.log('Fawaterk status response:', JSON.stringify(statusData, null, 2));

                if (response.ok) {
                    const fawaterkStatus = statusData.data?.status_text?.toLowerCase() || statusData.data?.payment_status?.toLowerCase();
                    console.log(`Fawaterk status: ${fawaterkStatus}`);
                    
                    if (fawaterkStatus === 'paid' || fawaterkStatus === 'success' || fawaterkStatus === 'successful') {
                        console.log('Payment verified as paid. Updating DB...');
                        
                        // Use atomic update to prevent race conditions with webhook
                        const updatedPayment = await Payment.findOneAndUpdate(
                            { _id: payment._id, status: 'pending' },
                            { 
                                status: 'paid', 
                                paidAt: new Date() 
                            },
                            { new: true }
                        );

                        if (updatedPayment) {
                            console.log('Payment status updated to paid.');
                            payment.status = 'paid';
                            payment.paidAt = updatedPayment.paidAt;

                            // Add form credits to user if not already added
                            const user = await User.findOneAndUpdate(
                                        { _id: payment.user },
                                        { $inc: { formCredits: payment.formCredits } },
                                        { new: true }
                                    );
                            if (user) {
                                // Double check (although unlikely race here if status just changed)
                                //user.formCredits = (user.formCredits || 0) + payment.formCredits;
                                //await user.save();
                                console.log(`Credited user ${user._id} with ${payment.formCredits} forms. New balance: ${user.formCredits}`);
                            } else {
                                console.error(`User ${payment.user} not found for credit addition.`);
                            }
                        } else {
                            // Payment status was changed concurrently (e.g. by webhook)
                            console.log('Payment status update skipped (concurrently modified). Fetching fresh.');
                            const freshPayment = await Payment.findById(payment._id);
                            if (freshPayment) {
                                payment.status = freshPayment.status;
                                payment.paidAt = freshPayment.paidAt;
                            }
                        }
                    } else if (fawaterkStatus === 'failed' || fawaterkStatus === 'declined' || fawaterkStatus === 'expired') {
                        payment.status = 'failed';
                        await payment.save();
                    }
                }
            } catch (verifyError) {
                console.error('Error verifying payment with Fawaterk:', verifyError);
                // Continue with local status if verification fails
            }
        }

        res.json({
            id: payment._id,
            status: payment.status,
            amount: payment.amount / 100,
            currency: payment.currency,
            formCredits: payment.formCredits,
            paidAt: payment.paidAt,
            createdAt: payment.createdAt
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get user's payment history
 * GET /api/payments/history
 */
export async function getPaymentHistory(req, res) {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const payments = await Payment.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments({ user: userId });

        res.json({
            payments: payments.map(p => ({
                id: p._id,
                status: p.status,
                amount: p.amount / 100,
                currency: p.currency,
                formCredits: p.formCredits,
                paidAt: p.paidAt,
                createdAt: p.createdAt
            })),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalPayments: total
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get user's form credits balance
 * GET /api/payments/credits
 */
export async function getFormCredits(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const paymentsEnabled = process.env.ENABLE_PAYMENTS !== 'false';

        const effectiveSettings = await getEffectivePaymentPackageSettings();

        // Determine which package should be shown (first-time vs follow-up)
        const lastPaidPayment = await Payment.findOne({ user: userId, status: 'paid' })
            .sort({ paidAt: -1, createdAt: -1 })
            .select('paidAt createdAt')
            .lean();

        const lastPaidAt = lastPaidPayment?.paidAt || lastPaidPayment?.createdAt || null;
        const eligibleForFirstTime = isFirstTimeEligible({
            lastPaidAt,
            resetEnabled: effectiveSettings.firstTimeResetEnabled,
            resetAfterDays: effectiveSettings.firstTimeResetAfterDays
        });

        const packageType = eligibleForFirstTime ? 'first_time' : 'follow_up';
        const pricePerPackage = packageType === 'first_time'
            ? effectiveSettings.firstTime.price
            : effectiveSettings.followUp.price;
        const formsPerPackage = packageType === 'first_time'
            ? effectiveSettings.firstTime.formsPerPackage
            : effectiveSettings.followUp.formsPerPackage;

        res.json({
            formCredits: user.formCredits || 0,
            // Backwards-compatible fields consumed by the frontend
            pricePerPackage,
            formsPerPackage,
            currency: fawaterkConfig.currency,
            paymentsEnabled: paymentsEnabled,

            // New fields to support separating first-time vs follow-up packages
            packageType,
            isFirstTimeBuyer: eligibleForFirstTime,

            // Reset policy info (for admin/debugging; safe for UI to ignore)
            firstTimeResetEnabled: effectiveSettings.firstTimeResetEnabled,
            firstTimeResetAfterDays: effectiveSettings.firstTimeResetAfterDays,
            lastPaidAt
        });

    } catch (error) {
        console.error('Get form credits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Verify webhook signature from Fawaterk
 */
function verifyWebhookSignature(data, receivedSignature) {
    try {
        const payload = JSON.stringify(data);
        const calculatedSignature = crypto
            .createHmac('sha256', fawaterkConfig.webhookSecret)
            .update(payload)
            .digest('hex');

        return calculatedSignature === receivedSignature;
    } catch (error) {
        console.error('Webhook signature verification error:', error);
        return false;
    }
}
