import mongoose from 'mongoose';
const { Schema } = mongoose;

const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Paymob specific fields
    paymobIntentionId: {
        type: String,
        required: true,
        unique: true
    },
    paymobOrderId: {
        type: Number,
        default: null
    },
    paymobTransactionId: {
        type: Number,
        default: null
    },
    // Payment details
    amount: {
        type: Number,
        required: true  // Amount in cents
    },
    currency: {
        type: String,
        default: 'EGP'
    },
    formCredits: {
        type: Number,
        required: true,
        default: 4  // Number of forms purchased (4 per payment)
    },
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'expired'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: null  // card, wallet, etc.
    },
    // Additional metadata from Paymob callback
    callbackData: {
        type: Schema.Types.Mixed,
        default: null
    },
    // Error information if payment failed
    errorMessage: {
        type: String,
        default: null
    },
    // Timestamps
    paidAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
