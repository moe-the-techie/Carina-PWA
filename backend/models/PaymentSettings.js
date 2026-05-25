import mongoose from 'mongoose';
const { Schema } = mongoose;

const packageSchema = new Schema({
    price: {
        type: Number,
        min: 0,
        default: null // main currency unit (e.g., EGP)
    },
    formsPerPackage: {
        type: Number,
        min: 1,
        default: null
    }
}, { _id: false });

const paymentSettingsSchema = new Schema({
    key: {
        type: String,
        unique: true,
        default: 'payment_packages'
    },
    firstTime: {
        type: packageSchema,
        default: () => ({})
    },
    followUp: {
        type: packageSchema,
        default: () => ({})
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

paymentSettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

export default PaymentSettings;
