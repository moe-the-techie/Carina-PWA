import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    firebaseUid: {
        type: String,
        required: function() {
            return this.isFirebaseUser !== false;
        },
        unique: true,
        sparse: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: function() {
            return this.isFirebaseUser === false;
        },
        select: false
    },
    isFirebaseUser: {
        type: Boolean,
        default: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    plans: [{
        type: Schema.Types.ObjectId,
        default: []
    }],
    forms: [{
        type: Schema.Types.ObjectId,
        ref: 'Form',
        default: []
    }],
    dateOfBirth: {
        type: Date,
        default: null
    },
    isMother: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    profileImageUrl: {
        type: String,
        default: null
    },
    profileImagePublicId: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    lastVerificationEmailSentAt: {
        type: Date,
        default: null
    },
    lastPasswordResetEmailSentAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema)

export default User;
