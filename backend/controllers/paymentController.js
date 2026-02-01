import Payment from '../models/Payment.js';
import User from '../models/User.js';
import fawaterkConfig from '../config/fawaterk.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

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

        // Generate unique reference for this payment
        const cartId = `CARINA-${userId}-${Date.now()}`;
        
        // Get amount (Fawaterk expects amount in main currency unit, not cents)
        const amount = fawaterkConfig.formPackagePrice;

        // Prepare customer data
        const customerData = {
            first_name: user.name.split(' ')[0] || 'User',
            last_name: user.name.split(' ').slice(1).join(' ') || 'Name',
            email: user.email,
            phone: user.phone || '01000000000',
            address: 'Cairo, Egypt'
        };

        // Prepare cart items
        const cartItems = [
            {
                name: 'Form Credits Package',
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
            fawaterkInvoiceId: invoiceData.data.invoice_id.toString(),
            fawaterkInvoiceKey: invoiceData.data.invoice_key,
            amount: amount * 100, // Store in cents for consistency
            currency: fawaterkConfig.currency,
            formCredits: fawaterkConfig.formsPerPackage,
            status: 'pending'
        });

        await payment.save();

        // Return the necessary data for frontend
        res.status(201).json({
            success: true,
            payment: {
                id: payment._id,
                invoiceId: invoiceData.data.invoice_id,
                amount: amount,
                currency: fawaterkConfig.currency,
                formsCount: fawaterkConfig.formsPerPackage
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
        const callbackData = req.body;
        
        console.log('Fawaterk callback received:', JSON.stringify(callbackData, null, 2));

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
        const invoiceId = callbackData.invoice_id || callbackData.invoiceId;
        const invoiceKey = callbackData.invoice_key || callbackData.invoiceKey;
        const paymentStatus = callbackData.payment_status || callbackData.paymentStatus;
        const transactionId = callbackData.transaction_id || callbackData.transactionId;

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
                const user = await User.findById(payment.user);
                if (user) {
                    user.formCredits = (user.formCredits || 0) + payment.formCredits;
                    await user.save();
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
            // Check if we need to deduct credits (if was previously paid)
            if (payment.status === 'paid') {
                const user = await User.findById(payment.user);
                if (user) {
                    user.formCredits = Math.max(0, (user.formCredits || 0) - payment.formCredits);
                    await user.save();
                    console.log(`Refunded ${payment.formCredits} credits from user ${user._id}. New total: ${user.formCredits}`);
                }
            }
            payment.status = 'refunded';
        } else if (statusLower === 'failed' || statusLower === 'declined' || statusLower === 'expired' || statusLower === 'canceled') {
            payment.status = 'failed';
            payment.errorMessage = callbackData.message || callbackData.error || 'Payment failed';
        } else {
            payment.status = 'failed';
            payment.errorMessage = `Unknown status: ${paymentStatus}`;
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
                            const user = await User.findById(payment.user);
                            if (user) {
                                // Double check (although unlikely race here if status just changed)
                                user.formCredits = (user.formCredits || 0) + payment.formCredits;
                                await user.save();
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

        res.json({
            formCredits: user.formCredits || 0,
            pricePerPackage: fawaterkConfig.formPackagePrice,
            formsPerPackage: fawaterkConfig.formsPerPackage,
            currency: fawaterkConfig.currency,
            paymentsEnabled: paymentsEnabled
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
