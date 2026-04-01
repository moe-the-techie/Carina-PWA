import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema for a single day's meal plan (same as Plan model)
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

const fruitItemSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    quantity: {
        type: String,
        trim: true,
        required: true
    }
}, { _id: false });

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
    defaultPlanType: {
        type: String,
        enum: ['weekly', 'general'],
        default: 'weekly'
    },
    defaultGoals: {
        targetCalories: { type: Number, min: 0 },
        targetProtein: { type: Number, min: 0 },
        targetCarbs: { type: Number, min: 0 },
        targetFats: { type: Number, min: 0 }
    },
    // Weekly meal plan template - 7 days with breakfast, lunch, dinner, snack
    defaultWeeklyPlan: {
        saturday: dayMealSchema,
        sunday: dayMealSchema,
        monday: dayMealSchema,
        tuesday: dayMealSchema,
        wednesday: dayMealSchema,
        thursday: dayMealSchema,
        friday: dayMealSchema
    },
    // General meal plan template - same meals for all days
    defaultGeneralPlan: dayMealSchema,
    defaultFruits: {
        type: [fruitItemSchema],
        default: []
    },
    // General recommendations
    defaultRecommendations: {
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
    defaultWarnings: [{
        type: String,
        trim: true
    }],
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
        default: 0,
        min: 0
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