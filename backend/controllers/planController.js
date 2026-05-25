import Plan from '../models/Plan.js';
import Form from '../models/Form.js';
import User from '../models/User.js';
import { publishMessage } from '../config/ably.js';

function parseActivationDate(rawValue) {
    if (rawValue === undefined) {
        return { provided: false, value: null, invalid: false };
    }

    if (rawValue === null || rawValue === '') {
        return { provided: true, value: null, invalid: false };
    }

    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
        return { provided: true, value: null, invalid: true };
    }

    return { provided: true, value: parsed, invalid: false };
}

function calculateExpiryDate(activatedAt, durationWeeks) {
    const weeks = Number(durationWeeks);
    const durationInDays = Number.isFinite(weeks) && weeks > 0 ? Math.round(weeks * 7) : 7;
    const expiresAt = new Date(activatedAt);
    expiresAt.setDate(expiresAt.getDate() + durationInDays);
    return expiresAt;
}

function resolveActivationFields({ status, duration, currentActivatedAt, currentExpiresAt, requestedActivatedAt }) {
    if (status !== 'active') {
        return {
            activatedAt: currentActivatedAt,
            expiresAt: currentExpiresAt
        };
    }

    const activatedAt = requestedActivatedAt || currentActivatedAt || new Date();
    return {
        activatedAt,
        expiresAt: calculateExpiryDate(activatedAt, duration)
    };
}

// Create a new plan
export async function createPlan(req, res) {
    try {
        const { 
            userId, 
            formId, 
            title, 
            description, 
            duration, 
            planType,
            goals,
            recommendations,
            weeklyPlan,
            generalPlan,
            fruits,
            warnings,
            templateId,
            status,
            activatedAt
        } = req.body;

        const parsedActivation = parseActivationDate(activatedAt);
        if (parsedActivation.invalid) {
            return res.status(400).json({ error: 'Invalid activation date' });
        }

        // Verify the form exists and belongs to the user
        const form = await Form.findOne({ _id: formId, user: userId });
        if (!form) {
            return res.status(404).json({ error: 'Form not found or does not belong to user' });
        }

        // Verify the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let existingPlan = await Plan.findOne({ form: formId });
        
        if (existingPlan) {
            // Update the existing plan instead of creating a new one
            const previousStatus = existingPlan.status;
            existingPlan.title = title;
            existingPlan.description = description;
            existingPlan.duration = duration;
            existingPlan.planType = planType || existingPlan.planType || 'weekly';
            existingPlan.goals = goals || {};
            existingPlan.recommendations = recommendations || {};
            existingPlan.weeklyPlan = weeklyPlan || existingPlan.weeklyPlan || {};
            existingPlan.generalPlan = generalPlan || existingPlan.generalPlan || {};
            existingPlan.fruits = fruits || existingPlan.fruits || [];
            existingPlan.warnings = warnings || [];
            existingPlan.status = status || 'draft'; // Use provided status or default to draft
            const shouldResetActivation =
                existingPlan.status === 'active' &&
                previousStatus !== 'active' &&
                !parsedActivation.provided;

            const activationFields = resolveActivationFields({
                status: existingPlan.status,
                duration: existingPlan.duration,
                currentActivatedAt: existingPlan.activatedAt,
                currentExpiresAt: existingPlan.expiresAt,
                requestedActivatedAt: shouldResetActivation ? new Date() : parsedActivation.value
            });
            existingPlan.activatedAt = activationFields.activatedAt;
            existingPlan.expiresAt = activationFields.expiresAt;
            
            await existingPlan.save();
            
            // Populate the response
            const updatedPlan = await Plan.findById(existingPlan._id)
                .populate('user', 'name email')
                .populate('form')
                .populate('createdBy', 'name');

            await Form.findByIdAndUpdate(formId, { 
                reviewed: true, 
                planSent: true 
            });

            // Publish notification to Ably
            await publishMessage(`plans:${userId}`, 'plan-updated', {
                planId: existingPlan._id,
                title: title || existingPlan.title,
                userId: userId,
                isUpdate: true
            });

            return res.status(200).json({ 
                message: 'Plan updated successfully', 
                plan: updatedPlan,
                isUpdate: true
            });
        }

        // Create new plan if none exists
        const initialStatus = status || 'draft';
        const activationFields = resolveActivationFields({
            status: initialStatus,
            duration,
            currentActivatedAt: null,
            currentExpiresAt: null,
            requestedActivatedAt: parsedActivation.value
        });

        const newPlan = new Plan({
            user: userId,
            form: formId,
            title,
            description,
            duration,
            planType: planType || 'weekly',
            goals: goals || {},
            recommendations: recommendations || {},
            weeklyPlan: weeklyPlan || {},
            generalPlan: generalPlan || {},
            fruits: fruits || [],
            warnings: warnings || [],
            createdBy: req.user._id,
            status: initialStatus,
            activatedAt: activationFields.activatedAt,
            expiresAt: activationFields.expiresAt
        });

        await newPlan.save();

        await Form.findByIdAndUpdate(formId, { 
            reviewed: true, 
            planSent: true 
        });

        if (templateId) {
            const PlanTemplate = (await import('../models/PlanTemplate.js')).default;
            await PlanTemplate.findByIdAndUpdate(templateId, { 
                $inc: { usageCount: 1 } 
            });
        }

        const populatedPlan = await Plan.findById(newPlan._id)
            .populate('user', 'name email')
            .populate('form')
            .populate('createdBy', 'name');

         // Publish notification to Ably
         await publishMessage(`plans:${userId}`, 'plan-created', {
            planId: newPlan._id,
            title: title,
            userId: userId,
            isUpdate: false
        });

        res.status(201).json({ 
            message: 'Plan created successfully', 
            plan: populatedPlan 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get all plans (admin only) - OPTIMIZED with parallel queries
export async function getAllPlans(req, res) {
    try {
        const { page = 1, limit = 10, status, userId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (userId) {
            query.user = userId;
        }

        // Run find and count in parallel to eliminate double-query
        const [plans, total] = await Promise.all([
            Plan.find(query)
                .populate('user', 'name email')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip)
                .lean(),
            Plan.countDocuments(query)
        ]);

        res.status(200).json({
            plans,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get single plan details
export async function getPlanDetails(req, res) {
    try {
        const { planId } = req.params;
        
        const plan = await Plan.findById(planId)
            .populate('user', 'name email dateOfBirth gender')
            .populate('form')
            .populate('createdBy', 'name');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.status(200).json({ plan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Update plan
export async function updatePlan(req, res) {
    try {
        const { planId } = req.params;
        const updateData = { ...req.body };

        const parsedActivation = parseActivationDate(updateData.activatedAt);
        if (parsedActivation.invalid) {
            return res.status(400).json({ error: 'Invalid activation date' });
        }

        const existingPlan = await Plan.findById(planId).select('status duration activatedAt expiresAt');
        if (!existingPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const nextStatus = updateData.status || existingPlan.status;
        const nextDuration = updateData.duration || existingPlan.duration;
        const shouldResetActivation =
            nextStatus === 'active' &&
            existingPlan.status !== 'active' &&
            !parsedActivation.provided;
        const activationFields = resolveActivationFields({
            status: nextStatus,
            duration: nextDuration,
            currentActivatedAt: existingPlan.activatedAt,
            currentExpiresAt: existingPlan.expiresAt,
            requestedActivatedAt: shouldResetActivation ? new Date() : parsedActivation.value
        });

        if (nextStatus === 'active') {
            updateData.activatedAt = activationFields.activatedAt;
            updateData.expiresAt = activationFields.expiresAt;
        }

        if (parsedActivation.provided && nextStatus !== 'active') {
            delete updateData.activatedAt;
        }

        const plan = await Plan.findByIdAndUpdate(
            planId,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email')
         .populate('createdBy', 'name');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Publish notification to Ably
        await publishMessage(`plans:${plan.user._id}`, 'plan-updated', {
            planId: plan._id,
            title: plan.title,
            userId: plan.user._id,
            isUpdate: true
        });

        res.status(200).json({ 
            message: 'Plan updated successfully', 
            plan 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Activate plan
export async function activatePlan(req, res) {
    try {
        const { planId } = req.params;
        const parsedActivation = parseActivationDate(req.body?.activatedAt);
        if (parsedActivation.invalid) {
            return res.status(400).json({ error: 'Invalid activation date' });
        }

        const currentPlan = await Plan.findById(planId).select('duration activatedAt expiresAt');
        if (!currentPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const activationFields = resolveActivationFields({
            status: 'active',
            duration: currentPlan.duration,
            currentActivatedAt: currentPlan.activatedAt,
            currentExpiresAt: currentPlan.expiresAt,
            requestedActivatedAt: parsedActivation.value || new Date()
        });
        
        const plan = await Plan.findByIdAndUpdate(
            planId,
            { 
                status: 'active',
                activatedAt: activationFields.activatedAt,
                expiresAt: activationFields.expiresAt
            },
            { new: true }
        ).populate('user', 'name email')
         .populate('createdBy', 'name');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Publish notification to Ably
        await publishMessage(`plans:${plan.user._id}`, 'plan-updated', {
            planId: plan._id,
            title: plan.title,
            userId: plan.user._id,
            isUpdate: true
        });

        res.status(200).json({ 
            message: 'Plan activated successfully', 
            plan 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Delete plan
export async function deletePlan(req, res) {
    try {
        const { planId } = req.params;
        
        const plan = await Plan.findByIdAndDelete(planId);

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Publish notification to Ably so user clients can refresh caches
        try {
            await publishMessage(`plans:${plan.user}`, 'plan-deleted', {
                planId: plan._id,
                title: plan.title,
                userId: plan.user,
                isDeleted: true
            });
        } catch (publishError) {
            // Do not fail the request if realtime publish fails
            console.error('Error publishing plan-deleted event:', publishError);
        }

        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get plans for a specific user (for form selection)
export async function getPlansForUser(req, res) {
    try {
        const { userId } = req.params;
        
        const plans = await Plan.find({ user: userId })
            .populate('form', 'createdAt currentWeight desiredWeight')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ plans });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get plan associated with a specific form
export async function getPlanByForm(req, res) {
    try {
        const { formId } = req.params;
        
        const plan = await Plan.findOne({ form: formId })
            .populate('user', 'name email dateOfBirth gender profileImageUrl isMother phoneNumber profession')
            .populate('form', 'currentWeight desiredWeight createdAt')
            .populate('createdBy', 'name email');

        if (!plan) {
            return res.status(404).json({ error: 'No plan found for this form' });
        }

        res.status(200).json({ plan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Submit feedback for a plan
export async function submitPlanFeedback(req, res) {
    try {
        const { planId } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const plan = await Plan.findOne({ _id: planId, user: req.user._id });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found or does not belong to user' });
        }

        plan.feedback = {
            rating,
            comment: comment || '',
            submittedAt: new Date()
        };

        await plan.save();

        res.status(200).json({ 
            message: 'Feedback submitted successfully', 
            feedback: plan.feedback 
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get feedback for a plan (admin only)
export async function getPlanFeedback(req, res) {
    try {
        const { planId } = req.params;
        
        const plan = await Plan.findById(planId)
            .select('feedback user title')
            .populate('user', 'name email');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        if (!plan.feedback || !plan.feedback.rating) {
            return res.status(404).json({ error: 'No feedback submitted for this plan' });
        }

        res.status(200).json({ 
            planId: plan._id,
            planTitle: plan.title,
            user: plan.user,
            feedback: plan.feedback 
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: error.message });
    }
}

// Log daily progress for a plan
export async function logDailyProgress(req, res) {
    try {
        const { planId } = req.params;
        const { date, mealsCompleted, exerciseCompleted, waterIntake, weight, notes, mood } = req.body;

        const plan = await Plan.findOne({ _id: planId, user: req.user._id });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found or does not belong to user' });
        }

        if (plan.status !== 'active') {
            return res.status(400).json({ error: 'Can only log progress for active plans' });
        }

        // Normalize the date to start of day
        const progressDate = new Date(date || new Date());
        progressDate.setHours(0, 0, 0, 0);

        // Check if progress already exists for this date
        const existingIndex = plan.progress.findIndex(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === progressDate.getTime();
        });

        const progressEntry = {
            date: progressDate,
            mealsCompleted: mealsCompleted || { breakfast: false, lunch: false, dinner: false, snack: false },
            exerciseCompleted: exerciseCompleted || false,
            waterIntake: waterIntake || 0,
            weight: weight,
            notes: notes || '',
            mood: mood || 'okay'
        };

        if (existingIndex >= 0) {
            // Update existing progress
            plan.progress[existingIndex] = progressEntry;
        } else {
            // Add new progress entry
            plan.progress.push(progressEntry);
        }

        // Update streak
        plan.updateStreak();

        await plan.save();

        res.status(200).json({
            message: 'Progress logged successfully',
            progress: progressEntry,
            currentStreak: plan.currentStreak,
            longestStreak: plan.longestStreak,
            overallProgress: plan.calculateProgress()
        });
    } catch (error) {
        console.error('Error logging progress:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get progress for a plan
export async function getPlanProgress(req, res) {
    try {
        const { planId } = req.params;
        const { startDate, endDate } = req.query;

        const plan = await Plan.findOne({ _id: planId, user: req.user._id })
            .select('progress currentStreak longestStreak activatedAt duration status');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found or does not belong to user' });
        }

        let progressData = plan.progress || [];

        // Filter by date range if provided
        if (startDate || endDate) {
            progressData = progressData.filter(p => {
                const pDate = new Date(p.date);
                if (startDate && pDate < new Date(startDate)) return false;
                if (endDate && pDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Sort by date descending (most recent first)
        progressData = progressData.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            progress: progressData,
            currentStreak: plan.currentStreak,
            longestStreak: plan.longestStreak,
            overallProgress: plan.calculateProgress(),
            totalDays: plan.duration * 7,
            daysLogged: plan.progress.length
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get today's progress for a plan
export async function getTodayProgress(req, res) {
    try {
        const { planId } = req.params;

        const plan = await Plan.findOne({ _id: planId, user: req.user._id })
            .select('progress currentStreak longestStreak planType weeklyPlan generalPlan fruits activatedAt duration');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found or does not belong to user' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find today's progress
        const todayProgress = plan.progress.find(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === today.getTime();
        });

        // Get today's day name for meals
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayDayName = days[today.getDay()];
        const todayMeals = plan.planType === 'general'
            ? (plan.generalPlan || {})
            : (plan.weeklyPlan?.[todayDayName] || {});

        res.status(200).json({
            date: today,
            dayName: todayDayName,
            planType: plan.planType || 'weekly',
            todayMeals,
            fruits: plan.fruits || [],
            progress: todayProgress || null,
            currentStreak: plan.currentStreak,
            longestStreak: plan.longestStreak,
            overallProgress: plan.calculateProgress()
        });
    } catch (error) {
        console.error('Error fetching today progress:', error);
        res.status(500).json({ error: error.message });
    }
}