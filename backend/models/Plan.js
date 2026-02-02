import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema for a single day's meal plan
const dayMealSchema = new Schema({
    breakfast: {
        type: String,
        trim: true,
        default: ''
    },
    lunch: {
        type: String,
        trim: true,
        default: ''
    },
    dinner: {
        type: String,
        trim: true,
        default: ''
    },
    snack: {
        type: String,
        trim: true,
        default: ''
    }
}, { _id: false });

const planSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    form: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    goals: {
        targetWeight: Number,
        targetCalories: Number,
        targetProtein: Number,
        targetCarbs: Number,
        targetFats: Number
    },
    // Weekly meal plan - 7 days with breakfast, lunch, dinner, snack
    weeklyPlan: {
        saturday: dayMealSchema,
        sunday: dayMealSchema,
        monday: dayMealSchema,
        tuesday: dayMealSchema,
        wednesday: dayMealSchema,
        thursday: dayMealSchema,
        friday: dayMealSchema
    },
    // General recommendations
    recommendations: {
        avoid: [{
            type: String,
            trim: true
        }],
        useCarefully: [{
            type: String,
            trim: true
        }],
        allowed: [{
            type: String,
            trim: true
        }],
        exercise: [{
            type: String,
            trim: true
        }],
        notes: {
            type: String,
            trim: true
        }
    },
    warnings: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'paused'],
        default: 'draft'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        submittedAt: {
            type: Date
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    activatedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});


const Plan = mongoose.model('Plan', planSchema);

export default Plan;
