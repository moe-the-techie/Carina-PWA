import PlanTemplate from '../models/PlanTemplate.js';
import Plan from '../models/Plan.js';

// Get all plan templates
export async function getAllTemplates(req, res) {
    try {
        const { page = 1, limit = 10, category, search, active } = req.query;
        const query = {};
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const templates = await PlanTemplate.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PlanTemplate.countDocuments(query);

        res.status(200).json({
            templates,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get template by ID
export async function getTemplateById(req, res) {
    try {
        const { templateId } = req.params;
        
        const template = await PlanTemplate.findById(templateId)
            .populate('createdBy', 'name email');
            
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: error.message });
    }
}

// Create new template
export async function createTemplate(req, res) {
    try {
        const {
            name,
            description,
            category,
            duration,
            defaultGoals,
            defaultRecommendations,
            defaultWarnings,
            tags
        } = req.body;

        const newTemplate = new PlanTemplate({
            name,
            description,
            category,
            duration,
            defaultGoals: defaultGoals || {},
            defaultRecommendations: defaultRecommendations || {},
            defaultWarnings: defaultWarnings || [],
            tags: tags || [],
            createdBy: req.user._id
        });

        await newTemplate.save();

        const populatedTemplate = await PlanTemplate.findById(newTemplate._id)
            .populate('createdBy', 'name email');

        res.status(201).json({ 
            message: 'Template created successfully', 
            template: populatedTemplate 
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: error.message });
    }
}

// Update template
export async function updateTemplate(req, res) {
    try {
        const { templateId } = req.params;
        const updateData = req.body;

        const template = await PlanTemplate.findByIdAndUpdate(
            templateId,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json({ 
            message: 'Template updated successfully', 
            template 
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: error.message });
    }
}

// Delete template
export async function deleteTemplate(req, res) {
    try {
        const { templateId } = req.params;

        const template = await PlanTemplate.findByIdAndDelete(templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: error.message });
    }
}

// Toggle template active status
export async function toggleTemplateStatus(req, res) {
    try {
        const { templateId } = req.params;

        const template = await PlanTemplate.findById(templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        template.isActive = !template.isActive;
        await template.save();

        res.status(200).json({ 
            message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`, 
            template 
        });
    } catch (error) {
        console.error('Error toggling template status:', error);
        res.status(500).json({ error: error.message });
    }
}

// Create template from existing plan
export async function createTemplateFromPlan(req, res) {
    try {
        const { planId } = req.params;
        const { name, description, category, tags } = req.body;

        const plan = await Plan.findById(planId);

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        const newTemplate = new PlanTemplate({
            name: name || `Template from ${plan.title}`,
            description: description || plan.description,
            category: category || 'General',
            duration: plan.duration,
            defaultGoals: plan.goals,
            tags: tags || [],
            createdBy: req.user._id
        });

        await newTemplate.save();

        const populatedTemplate = await PlanTemplate.findById(newTemplate._id)
            .populate('createdBy', 'name email');

        res.status(201).json({ 
            message: 'Template created from plan successfully', 
            template: populatedTemplate 
        });
    } catch (error) {
        console.error('Error creating template from plan:', error);
        res.status(500).json({ error: error.message });
    }
}

// Duplicate template
export async function duplicateTemplate(req, res) {
    try {
        const { templateId } = req.params;
        const { name } = req.body;

        const originalTemplate = await PlanTemplate.findById(templateId);

        if (!originalTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const duplicatedTemplate = new PlanTemplate({
            name: name || `Copy of ${originalTemplate.name}`,
            description: originalTemplate.description,
            category: originalTemplate.category,
            duration: originalTemplate.duration,
            defaultGoals: originalTemplate.defaultGoals,
            tags: originalTemplate.tags,
            createdBy: req.user._id
        });

        await duplicatedTemplate.save();

        const populatedTemplate = await PlanTemplate.findById(duplicatedTemplate._id)
            .populate('createdBy', 'name email');

        res.status(201).json({ 
            message: 'Template duplicated successfully', 
            template: populatedTemplate 
        });
    } catch (error) {
        console.error('Error duplicating template:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get template categories and stats
export async function getTemplateStats(req, res) {
    try {
        const totalTemplates = await PlanTemplate.countDocuments();
        const activeTemplates = await PlanTemplate.countDocuments({ isActive: true });
        
        const categoryStats = await PlanTemplate.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const mostUsedTemplates = await PlanTemplate.find()
            .sort({ usageCount: -1 })
            .limit(5)
            .populate('createdBy', 'name');

        res.status(200).json({
            totalTemplates,
            activeTemplates,
            categoryStats,
            mostUsedTemplates
        });
    } catch (error) {
        console.error('Error fetching template stats:', error);
        res.status(500).json({ error: error.message });
    }
}