import Plan from '../models/Plan.js';
import Form from '../models/Form.js';
import User from '../models/User.js';

// Create a new plan
export async function createPlan(req, res) {
    try {
        const { 
            userId, 
            formId, 
            title, 
            description, 
            duration, 
            weeklyPlans, 
            goals,
            templateId 
        } = req.body;

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
            existingPlan.title = title;
            existingPlan.description = description;
            existingPlan.duration = duration;
            existingPlan.weeklyPlans = weeklyPlans || [];
            existingPlan.goals = goals || {};
            existingPlan.status = 'draft'; // Reset to draft when updated
            
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

            return res.status(200).json({ 
                message: 'Plan updated successfully', 
                plan: updatedPlan,
                isUpdate: true
            });
        }

        // Create new plan if none exists
        const newPlan = new Plan({
            user: userId,
            form: formId,
            title,
            description,
            duration,
            weeklyPlans: weeklyPlans || [],
            goals: goals || {},
            createdBy: req.user._id,
            status: 'draft'
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

        res.status(201).json({ 
            message: 'Plan created successfully', 
            plan: populatedPlan 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get all plans (admin only)
export async function getAllPlans(req, res) {
    try {
        const { page = 1, limit = 10, status, userId } = req.query;
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (userId) {
            query.user = userId;
        }

        const plans = await Plan.find(query)
            .populate('user', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Plan.countDocuments(query); // Todo fix double query

        res.status(200).json({
            plans,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
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
        const updateData = req.body;

        const plan = await Plan.findByIdAndUpdate(
            planId,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email')
         .populate('createdBy', 'name');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

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
        
        const plan = await Plan.findByIdAndUpdate(
            planId,
            { 
                status: 'active',
                activatedAt: new Date()
            },
            { new: true }
        ).populate('user', 'name email')
         .populate('createdBy', 'name');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

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
            .populate('user', 'name email')
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