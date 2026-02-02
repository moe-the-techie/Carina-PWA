import mongoose from 'mongoose';
const { Schema } = mongoose;

const formSchema = new Schema ({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Form Type
    type: {
        type: String,
        enum: ['new-patient', 'follow-up'],
        default: 'new-patient'
    },
    // Patient Information (some might be fetched from User, but storing snapshot here)
    fullName: { type: String },
    email: { type: String },
    phoneNumber: { type: String },

    // Personal Information
    dateOfBirth: { type: Date },
    profession: { type: String },
    currentWeight: {
        type: Number,
        required: true
    },
    height: { type: Number },
    isMother: {
        type: Boolean,
        default: false
    },
    allergies: [{
        type: String,
        default: []
    }],
    menstrualCycle: { type: String },
    bowelMovement: { type: String },
    physicalActivity: { type: String },
    whoCooks: { type: String },
    currentSmoker: {
        type: Boolean,
        default: false,
        required: true
    },

    // Health History
    operations: { type: String },
    healthConditions: [{ // HTA, Diabetes, Heart Problem, Reflux, Cholesterol, Triglycerides, Anemia, Others
        type: String,
        default: []
    }],
    
    // Family History
    familyHistory: { type: String },

    // Medications & Guidance
    takeMedication: { type: Boolean, default: false },
    followedDietAdvice: { type: Boolean, default: false }, // Did someone tell you how to deal with your health problem?
    medications: [{
        type: String,
        default: []
    }],

    // Blood Test
    bloodTest: {
        urea: { type: String },
        creatinine: { type: String },
        glucose: { type: String },
        ldl: { type: String },
        hdl: { type: String },
        prolactin: { type: String },
        triglyceride: { type: String },
        tsh: { type: String }
    },

    // Diet History
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
    triedDietBefore: { type: Boolean, default: false },
    weightLossMedication: { type: Boolean, default: false }, // Did you take any medication to lose weight?
    weightChangeSinceBirth: { type: String },
    alwaysOverweight: { type: Boolean, default: false },

    // 24 Hour Recall
    breakfast: {
        type: String,
        // enum: ['Always', 'Sometimes', 'Never'], // Relaxing enum as user might input text in new design? 
        // Request says "Breakfast". Old model had enum. Keeping simple string allows more flexibility if design changes, 
        // but enum is safer if UI is strict. User prompt listed "Breakfast" as a bullet. 
        // I will keep existing enum if it makes sense, but the prompt implies "What did you eat?" as 24h recall.
        // "24 Hour Recall" usually means "What did you eat yesterday?".
        // If it means "Do you eat breakfast?", the old enum is fine.
        // But "24 Hour Recall -> Breakfast, Lunch, Dinner" strongly suggests content of the meal.
        // I will change it to String to allow description.
        type: String, 
        required: true
    },
    lunch: { type: String },
    dinner: { type: String },

    // Diet & Goals
    dislikedFood: { type: String }, // What you don't eat?
    dietGiven: { type: String },
    goals: [{
        type: String,
        maxlength: 200,
        default: []
    }],
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
    inbodyImages: [{
        type: String
    }],
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
