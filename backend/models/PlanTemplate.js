import mongoose from 'mongoose';
const { Schema } = mongoose;

const mealTemplateSchema = new Schema({
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

const dayTemplateSchema = new Schema({
    day: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    breakfast: mealTemplateSchema,
    lunch: mealTemplateSchema,
    dinner: mealTemplateSchema,
    snacks: [mealTemplateSchema],
    totalCalories: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
});

const planTemplateSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['Weight Loss', 'Weight Gain', 'Maintenance', 'Athletic', 'Medical', 'General'],
        default: 'General'
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    weeklyTemplate: [dayTemplateSchema],
    defaultGoals: {
        targetCalories: Number,
        targetProtein: Number,
        targetCarbs: Number,
        targetFats: Number
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    usageCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
planTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Increment usage count when template is used
planTemplateSchema.methods.incrementUsage = function() {
    this.usageCount += 1;
    return this.save();
};

const PlanTemplate = mongoose.model('PlanTemplate', planTemplateSchema);

export default PlanTemplate;