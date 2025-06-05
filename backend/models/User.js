import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
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
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema)

export default User;
