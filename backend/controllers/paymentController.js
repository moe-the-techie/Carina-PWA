import Payment from '../models/Payment.js';
import User from '../models/User.js';
import fawaterkConfig from '../config/fawaterk.js';
import crypto from 'crypto';

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

        // Update payment record
        payment.fawaterkTransactionId = transactionId;
        payment.callbackData = callbackData;
        payment.updatedAt = new Date();

        // Map Fawaterk status to our status
        const statusLower = paymentStatus?.toLowerCase();
        if (statusLower === 'paid' || statusLower === 'success' || statusLower === 'successful') {
            payment.status = 'paid';
            payment.paidAt = new Date();
            payment.paymentMethod = callbackData.payment_method || 'card';

            // Add form credits to user
            const user = await User.findById(payment.user);
            if (user) {
                user.formCredits = (user.formCredits || 0) + payment.formCredits;
                await user.save();
                console.log(`Added ${payment.formCredits} form credits to user ${user._id}. New total: ${user.formCredits}`);
            }
        } else if (statusLower === 'pending' || statusLower === 'processing') {
            payment.status = 'pending';
        } else if (statusLower === 'refunded') {
            payment.status = 'refunded';
        } else if (statusLower === 'failed' || statusLower === 'declined' || statusLower === 'expired') {
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

        const payment = await Payment.findOne({ _id: paymentId, user: userId });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Optionally verify with Fawaterk API for pending payments
        if (payment.status === 'pending' && payment.fawaterkInvoiceId) {
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

                if (response.ok) {
                    const statusData = await response.json();
                    const fawaterkStatus = statusData.data?.payment_status?.toLowerCase();
                    
                    if (fawaterkStatus === 'paid' || fawaterkStatus === 'success' || fawaterkStatus === 'successful') {
                        payment.status = 'paid';
                        payment.paidAt = new Date();
                        await payment.save();

                        // Add form credits to user if not already added
                        const user = await User.findById(payment.user);
                        if (user) {
                            user.formCredits = (user.formCredits || 0) + payment.formCredits;
                            await user.save();
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
