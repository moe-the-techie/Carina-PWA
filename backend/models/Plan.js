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

// Schema for daily progress tracking
const dailyProgressSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    mealsCompleted: {
        breakfast: { type: Boolean, default: false },
        lunch: { type: Boolean, default: false },
        dinner: { type: Boolean, default: false },
        snack: { type: Boolean, default: false }
    },
    exerciseCompleted: {
        type: Boolean,
        default: false
    },
    waterIntake: {
        type: Number, // glasses of water
        default: 0
    },
    weight: {
        type: Number // optional daily weight log
    },
    notes: {
        type: String,
        trim: true
    },
    mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'tired', 'bad'],
        default: 'okay'
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
    // Daily progress tracking
    progress: [dailyProgressSchema],
    // Streak tracking
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
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
    },
    reminderSentAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
});

// Method to calculate overall progress percentage
planSchema.methods.calculateProgress = function() {
    if (!this.activatedAt || !this.duration) return 0;
    
    const totalDays = this.duration * 7;
    const completedDays = this.progress.filter(p => {
        const meals = p.mealsCompleted;
        // Count a day as complete if at least 3 meals are done
        const mealsCompleted = [meals.breakfast, meals.lunch, meals.dinner, meals.snack]
            .filter(Boolean).length;
        return mealsCompleted >= 3;
    }).length;
    
    return Math.min(Math.round((completedDays / totalDays) * 100), 100);
};

// Method to update streak
planSchema.methods.updateStreak = function() {
    if (!this.progress || this.progress.length === 0) {
        this.currentStreak = 0;
        return;
    }

    // Sort progress by date descending
    const sortedProgress = [...this.progress].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedProgress.length; i++) {
        const progressDate = new Date(sortedProgress[i].date);
        progressDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        // Check if this progress is for the expected day in sequence
        if (progressDate.getTime() === expectedDate.getTime()) {
            const meals = sortedProgress[i].mealsCompleted;
            const mealsCompleted = [meals.breakfast, meals.lunch, meals.dinner, meals.snack]
                .filter(Boolean).length;
            
            if (mealsCompleted >= 2) {
                streak++;
            } else {
                break;
            }
        } else if (progressDate.getTime() < expectedDate.getTime()) {
            // Gap in days, break streak
            break;
        }
    }

    this.currentStreak = streak;
    if (streak > this.longestStreak) {
        this.longestStreak = streak;
    }
};

// Performance indexes for common queries
planSchema.index({ user: 1, createdAt: -1 }); // User's plans sorted by date
planSchema.index({ status: 1, createdAt: -1 }); // Filter by status
planSchema.index({ form: 1 }, { unique: true }); // One plan per form
planSchema.index({ status: 1, activatedAt: 1 }); // For reminder service queries
planSchema.index({ user: 1, status: 1 }); // User's active/draft plans
planSchema.index({ createdBy: 1 }); // Plans by admin


const Plan = mongoose.model('Plan', planSchema);

export default Plan;
