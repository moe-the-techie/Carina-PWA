import mongoose from 'mongoose';
const { Schema } = mongoose;

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
    defaultGoals: {
        targetCalories: Number,
        targetProtein: Number,
        targetCarbs: Number,
        targetFats: Number
    },
    defaultRecommendations: {
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