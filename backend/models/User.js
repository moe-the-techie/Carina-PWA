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
    lastProfileImageChangeAt: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    formCredits: {
        type: Number,
        default: 0  // Number of form submissions the user can make
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
    pushDevices: [{
        deviceId: {
            type: String,
            required: true
        },
        platform: {
            type: String,
            enum: ['web', 'android', 'ios'],
            default: 'web'
        },
        userAgent: {
            type: String,
            default: ''
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema)

export default User;
