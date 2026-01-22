import Payment from '../models/Payment.js';
import User from '../models/User.js';
import paymobConfig from '../config/paymob.js';
import crypto from 'crypto';

/**
 * Create a payment intention using Paymob's Intention API
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
        const specialReference = `CARINA-${userId}-${Date.now()}`;
        
        // Calculate amount in cents (Paymob expects amount in cents)
        const amountCents = paymobConfig.formPackagePrice;

        // Prepare billing data
        const billingData = {
            first_name: user.name.split(' ')[0] || 'User',
            last_name: user.name.split(' ').slice(1).join(' ') || 'Name',
            email: user.email,
            phone_number: '+201000000000', // Default phone, can be updated if user has phone
            apartment: 'NA',
            floor: 'NA',
            street: 'NA',
            building: 'NA',
            city: 'Cairo',
            state: 'Cairo',
            country: 'EGY'
        };

        // Prepare the intention request body
        const intentionBody = {
            amount: amountCents,
            currency: paymobConfig.currency,
            payment_methods: [parseInt(paymobConfig.integrationId)],
            items: [
                {
                    name: 'Form Credits Package',
                    amount: amountCents,
                    description: `${paymobConfig.formsPerPackage} Form Submissions`,
                    quantity: 1
                }
            ],
            billing_data: billingData,
            customer: {
                first_name: billingData.first_name,
                last_name: billingData.last_name,
                email: billingData.email,
                extras: {
                    userId: userId.toString()
                }
            },
            extras: {
                userId: userId.toString(),
                formsCount: paymobConfig.formsPerPackage
            },
            special_reference: specialReference,
            expiration: 3600, // 1 hour expiration
            notification_url: `${process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace(':5173', ':5000') || 'http://localhost:5000'}/api/payments/callback`,
            redirection_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`
        };

        // Make request to Paymob Intention API
        const response = await fetch(`${paymobConfig.baseUrl}${paymobConfig.intentionEndpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${paymobConfig.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(intentionBody)
        });

        const intentionData = await response.json();

        if (!response.ok) {
            console.error('Paymob intention error:', intentionData);
            return res.status(response.status).json({ 
                error: 'Failed to create payment intention',
                details: intentionData
            });
        }

        // Create payment record in database
        const payment = new Payment({
            user: userId,
            paymobIntentionId: intentionData.id,
            paymobOrderId: intentionData.intention_order_id,
            amount: amountCents,
            currency: paymobConfig.currency,
            formCredits: paymobConfig.formsPerPackage,
            status: 'pending'
        });

        await payment.save();

        // Return the necessary data for frontend to display checkout
        res.status(201).json({
            success: true,
            payment: {
                id: payment._id,
                intentionId: intentionData.id,
                clientSecret: intentionData.client_secret,
                publicKey: paymobConfig.publicKey,
                amount: amountCents / 100, // Return in main currency unit for display
                currency: paymobConfig.currency,
                formsCount: paymobConfig.formsPerPackage
            },
            // For the unified checkout URL (alternative to Pixel)
            checkoutUrl: `${paymobConfig.checkoutUrl}?publicKey=${paymobConfig.publicKey}&clientSecret=${intentionData.client_secret}`
        });

    } catch (error) {
        console.error('Payment intention error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

/**
 * Paymob callback/webhook handler
 * POST /api/payments/callback
 */
export async function handlePaymentCallback(req, res) {
    try {
        const callbackData = req.body;
        
        console.log('Paymob callback received:', JSON.stringify(callbackData, null, 2));

        // Verify HMAC if present (for security)
        const receivedHmac = req.query.hmac || callbackData.hmac;
        if (receivedHmac && paymobConfig.hmacSecret) {
            const isValid = verifyHmac(callbackData, receivedHmac);
            if (!isValid) {
                console.error('Invalid HMAC signature');
                return res.status(400).json({ error: 'Invalid HMAC signature' });
            }
        }

        // Extract transaction details
        const obj = callbackData.obj || callbackData;
        const transactionId = obj.id;
        const orderId = obj.order?.id || obj.order_id;
        const success = obj.success === true || obj.success === 'true';
        const pending = obj.pending === true || obj.pending === 'true';
        const isVoided = obj.is_voided === true;
        const isRefunded = obj.is_refunded === true;
        const amountCents = obj.amount_cents;
        const errorOccured = obj.error_occured;
        const dataMessage = obj.data?.message;

        // Find the payment by order ID
        let payment = await Payment.findOne({ paymobOrderId: orderId });
        
        if (!payment) {
            // Try to find by special_reference in the merchant_order_id
            const merchantOrderId = obj.order?.merchant_order_id || obj.merchant_order_id;
            if (merchantOrderId) {
                const userId = merchantOrderId.split('-')[1];
                payment = await Payment.findOne({ 
                    user: userId,
                    status: 'pending',
                    amount: amountCents
                }).sort({ createdAt: -1 });
            }
        }

        if (!payment) {
            console.error('Payment not found for order:', orderId);
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Update payment record
        payment.paymobTransactionId = transactionId;
        payment.callbackData = callbackData;
        payment.updatedAt = new Date();

        if (isRefunded) {
            payment.status = 'refunded';
        } else if (isVoided) {
            payment.status = 'failed';
            payment.errorMessage = 'Transaction voided';
        } else if (success && !pending) {
            payment.status = 'paid';
            payment.paidAt = new Date();
            payment.paymentMethod = obj.source_data?.type || 'card';

            // Add form credits to user
            const user = await User.findById(payment.user);
            if (user) {
                user.formCredits = (user.formCredits || 0) + payment.formCredits;
                await user.save();
                console.log(`Added ${payment.formCredits} form credits to user ${user._id}. New total: ${user.formCredits}`);
            }
        } else if (pending) {
            payment.status = 'pending';
        } else {
            payment.status = 'failed';
            payment.errorMessage = dataMessage || 'Payment failed';
        }

        await payment.save();

        // Return success to Paymob
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
            id: transactionId, 
            success, 
            order: orderId,
            pending,
            amount_cents: amountCents,
            hmac 
        } = req.query;

        // Verify HMAC if present
        if (hmac && paymobConfig.hmacSecret) {
            // For redirect callbacks, verify using query parameters
            const isValid = verifyRedirectHmac(req.query, hmac);
            if (!isValid) {
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed?error=invalid_signature`);
            }
        }

        const isSuccess = success === 'true';
        const isPending = pending === 'true';

        // Find and update payment
        const payment = await Payment.findOne({ paymobOrderId: parseInt(orderId) });

        if (payment && isSuccess && !isPending) {
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
 * Get payment status
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
            pricePerPackage: paymobConfig.formPackagePrice / 100,
            formsPerPackage: paymobConfig.formsPerPackage,
            currency: paymobConfig.currency,
            paymentsEnabled: paymentsEnabled
        });

    } catch (error) {
        console.error('Get form credits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Verify HMAC signature for callback (POST request body)
 */
function verifyHmac(data, receivedHmac) {
    try {
        const obj = data.obj || data;
        
        // Paymob HMAC calculation fields (in alphabetical order)
        const hmacString = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order?.id || obj.order_id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success
        ].join('');

        const calculatedHmac = crypto
            .createHmac('sha512', paymobConfig.hmacSecret)
            .update(hmacString)
            .digest('hex');

        return calculatedHmac === receivedHmac;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
}

/**
 * Verify HMAC for redirect callback (query parameters)
 */
function verifyRedirectHmac(params, receivedHmac) {
    try {
        // Sorted alphabetically (excluding hmac parameter itself)
        const hmacString = [
            params.amount_cents,
            params.created_at,
            params.currency,
            params.error_occured,
            params.has_parent_transaction,
            params.id,
            params.integration_id,
            params.is_3d_secure,
            params.is_auth,
            params.is_capture,
            params.is_refunded,
            params.is_standalone_payment,
            params.is_voided,
            params.order,
            params.owner,
            params.pending,
            params.source_data_pan,
            params.source_data_sub_type,
            params.source_data_type,
            params.success
        ].join('');

        const calculatedHmac = crypto
            .createHmac('sha512', paymobConfig.hmacSecret)
            .update(hmacString)
            .digest('hex');

        return calculatedHmac === receivedHmac;
    } catch (error) {
        console.error('Redirect HMAC verification error:', error);
        return false;
    }
}
