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

// Calculate total calories for each day
dayPlanSchema.pre('save', function(next) {
    let total = 0;
    if (this.breakfast) total += this.breakfast.calories || 0;
    if (this.lunch) total += this.lunch.calories || 0;
    if (this.dinner) total += this.dinner.calories || 0;
    if (this.snacks) {
        this.snacks.forEach(snack => total += snack.calories || 0);
    }
    this.totalCalories = total;
    next();
});

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
