import mongoose from 'mongoose';
const { Schema } = mongoose;

const mealSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    calories: {
        type: Number,
        required: true
    },
    nutrients: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 }
    },
    ingredients: [{
        type: String,
        trim: true
    }],
    instructions: [{
        type: String,
        trim: true
    }]
});

const dayPlanSchema = new Schema({
    day: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
    snacks: [mealSchema],
    totalCalories: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
});

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
    weeklyPlans: [dayPlanSchema],
    goals: {
        targetWeight: Number,
        targetCalories: Number,
        targetProtein: Number,
        targetCarbs: Number,
        targetFats: Number
    },
    recommendations: {
        avoid: [{
            type: String,
            trim: true
        }],
        useCarefully: [{
            type: String,
            trim: true
        }],
        eatDaily: [{
            type: String,
            trim: true
        }],
        breakfast: [{
            category: {
                type: String,
                enum: ['Proteins', 'Carbohydrates', 'Fruits', 'Dairy', 'Healthy Fats', 'Beverages'],
                required: true
            },
            items: [{
                type: String,
                trim: true
            }]
        }],
        lunch: [{
            category: {
                type: String,
                enum: ['Proteins', 'Carbohydrates', 'Vegetables', 'Healthy Fats', 'Dairy', 'Beverages'],
                required: true
            },
            items: [{
                type: String,
                trim: true
            }]
        }],
        dinner: [{
            category: {
                type: String,
                enum: ['Proteins', 'Carbohydrates', 'Vegetables', 'Healthy Fats', 'Dairy', 'Beverages'],
                required: true
            },
            items: [{
                type: String,
                trim: true
            }]
        }],
        exercise: [{
            type: String,
            trim: true
        }]
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
