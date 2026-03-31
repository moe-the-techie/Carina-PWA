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
    phoneNumber: {
        type: String,
        trim: true,
        default: ''
    },
    profession: {
        type: String,
        trim: true,
        default: ''
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
    lastProfileImageChangeAt: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'chat_admin'],
        default: 'user'
    },
    formCredits: {
        type: Number,
        default: 0,  // Number of form submissions the user can make
        min: 0
    },
    userClass: {
        type: Schema.Types.ObjectId,
        ref: 'UserClass',
        default: null
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    bannedAt: {
        type: Date,
        default: null
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

// Performance indexes for common queries
userSchema.index({ role: 1, isVerified: 1, createdAt: -1 }); // Admin user listing
userSchema.index({ role: 1, isVerified: 1, userClass: 1 }); // Filter by class
userSchema.index({ name: 'text', email: 'text' }); // Text search for admin search
userSchema.index({ isBanned: 1 }); // Ban checks

const User = mongoose.model('User', userSchema)

export default User;
