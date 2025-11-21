import mongoose from 'mongoose';
const { Schema } = mongoose;

const formSchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentWeight: {
        type: Number,
        required: true
    },
    allergies: [{
        type: String,
        default: []
    }],
    currentSmoker: {
        type: Boolean,
        default: false,
        required: true
    },
    healthConditions: [{
        type: String,
        default: []
    }],
    medications: [{
        type: String,
        default: []
    }],
    goals: [{
        type: String,
        maxlength: 200,
        default: []
    }],
    minWeight: {
        type: Number,
        required: true
    },
    maxWeight: {
        type: Number,
        required: true
    },
    desiredWeight: {
        type: Number,
        required: true
    },
    obesityHistory: {
        type: Boolean,
        default: false,
        required: true
    },
    hydrated: {
        type: Boolean,
        default: true,
        required: true
    },
    breakfast: {
        type: String,
        enum: ['Always', 'Sometimes', 'Never'],
        required: true
    },
    nightEater: {
        type: Boolean,
        default: false,
        required: true
    },
    coffee: {
        type: Boolean,
        default: false,
        required: true
    },
    sugar: {
        type: Number,
        required: true,
        min: 0
    },
    snackTime: {
        type: String,
        enum: ['Before Lunch', 'After Lunch'],
        required: true
    },
    reviewed: {
        type: Boolean,
        default: false
    },
    planSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Form = mongoose.model('Form', formSchema);

export default Form;
