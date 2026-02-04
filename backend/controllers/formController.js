import Form from '../models/Form.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { uploadBodyImageToCloudinary, deleteImage } from '../config/cloudinary.js';
import cache, { CacheKeys } from '../config/cache.js';

// TODO: Add route for admin to get all forms that were not reviewed

export async function getAllForms (req, res) {
    // TODO: protect this route for admin only
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.reviewed) {
            query.reviewed = req.query.reviewed === 'true';
        }
        if (req.query.type) {
            if (req.query.type === 'new-patient') {
                // Include forms without type field for backward compatibility (assuming they are new-patient)
                query.$or = [
                    { type: 'new-patient' },
                    { type: { $exists: false } },
                    { type: null }
                ];
            } else {
                query.type = req.query.type;
            }
        }

        // Run find and count in parallel to eliminate double query
        const [forms, total] = await Promise.all([
            Form.find(query)
                .populate('user', 'name email dateOfBirth isMother gender profileImageUrl phoneNumber profession')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Form.countDocuments(query)
        ]);

        if (!forms || forms.length === 0) {
            if (total === 0) {
                // If filtering by type/reviewed, return empty list instead of 404 to avoid error on frontend
                 return res.status(200).json({ 
                    message: 'No forms found', 
                    forms: [],
                    totalPages: 0,
                    currentPage: page,
                    totalForms: 0
                });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getMyForms (req, res) {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { user: userId };

        // Run find and count in parallel
        const [forms, total] = await Promise.all([
            Form.find(query)
                .populate('user', 'name email dateOfBirth isMother gender profileImageUrl phoneNumber profession')
                .skip(skip)
                .limit(limit)
                .lean(),
            Form.countDocuments(query)
        ]);

        if (!forms || forms.length === 0) {
            if (total === 0) {
                return res.status(404).json({ error: 'No forms found for this user' });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserForms (req, res) {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { user: userId };

        // Run find and count in parallel
        const [forms, total] = await Promise.all([
            Form.find(query)
                .populate('user', 'name email dateOfBirth isMother gender')
                .skip(skip)
                .limit(limit)
                .lean(),
            Form.countDocuments(query)
        ]);

        if (!forms || forms.length === 0) {
            if (total === 0) {
                return res.status(404).json({ error: `404: No forms found for user with ID ${userId}` });
            }
        }

        res.status(200).json({ 
            message: 'Forms fetched successfully', 
            forms: forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalForms: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function newForm(req, res) {
    try {
        const userId = req.user._id;
        
        // Check if user has form credits
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if payments are enabled
        const paymentsEnabled = process.env.ENABLE_PAYMENTS !== 'false';

        // Check for form credits (admins have unlimited credits, skip if payments disabled)
        if (paymentsEnabled && user.role !== 'admin' && (!user.formCredits || user.formCredits <= 0)) {
            return res.status(403).json({ 
                error: 'No form credits available',
                code: 'NO_CREDITS',
                message: 'You need to purchase form credits to submit a new form.'
            });
        }

        const formData = { ...req.body, user: userId };

        // Populate fields from user data
        formData.phoneNumber = user.phoneNumber;
        formData.dateOfBirth = user.dateOfBirth;
        formData.profession = user.profession;
        formData.isMother = user.isMother;

        // Determine form type based on user's history
        const previousFormsCount = await Form.countDocuments({ user: userId });
        formData.type = previousFormsCount > 0 ? 'follow-up' : 'new-patient';

        const newForm = new Form(formData);
        await newForm.save();

        // Deduct one form credit (only for non-admin users when payments are enabled)
        if (paymentsEnabled && user.role !== 'admin') {
            user.formCredits -= 1;
            await user.save();
        }

        res.status(201).json({ 
            message: 'Form created successfully', 
            form: newForm,
            remainingCredits: user.formCredits
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Upload body image to Cloudinary
export async function uploadBodyImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageName = `body-image-${req.user._id}-${Date.now()}`;
        const uploadResult = await uploadBodyImageToCloudinary(req.file.buffer, imageName);

        res.status(200).json({
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            size: uploadResult.bytes
        });
    } catch (error) {
        console.error('Error in uploadBodyImage:', error);
        res.status(500).json({ error: error.message || 'Failed to upload body image' });
    }
}

/**
 * Delete a form and its corresponding plan (Admin only)
 * Also cleans up any associated images from Cloudinary
 */
export async function deleteFormAdmin(req, res) {
    try {
        const { formId } = req.params;

        // Find the form first
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Find and delete the corresponding plan if it exists
        const plan = await Plan.findOne({ form: formId });
        
        // Collect promises for parallel deletion
        const deletePromises = [];

        // Delete inbody images from Cloudinary if they exist
        if (form.inbodyImages && form.inbodyImages.length > 0) {
            for (const imageUrl of form.inbodyImages) {
                // Extract public ID from Cloudinary URL
                const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.\w+$/);
                if (publicIdMatch && publicIdMatch[1]) {
                    deletePromises.push(
                        deleteImage(publicIdMatch[1]).catch(err => 
                            console.error(`Failed to delete image ${publicIdMatch[1]}:`, err)
                        )
                    );
                }
            }
        }

        // Delete the plan if it exists
        if (plan) {
            deletePromises.push(Plan.findByIdAndDelete(plan._id));
        }

        // Delete the form
        deletePromises.push(Form.findByIdAndDelete(formId));

        // Execute all deletions in parallel
        await Promise.all(deletePromises);

        // Invalidate dashboard cache since counts changed
        cache.delete(CacheKeys.dashboardStats());

        res.status(200).json({ 
            message: 'Form deleted successfully',
            deletedPlan: plan ? true : false
        });
    } catch (error) {
        console.error('Error in deleteFormAdmin:', error);
        res.status(500).json({ error: error.message || 'Failed to delete form' });
    }
}

/**
 * Delete user's own form (only if not reviewed/no plan sent)
 * Users can only delete their own unreviewed forms
 */
export async function deleteMyForm(req, res) {
    try {
        const { formId } = req.params;
        const userId = req.user._id;

        // Find the form and verify ownership
        const form = await Form.findOne({ _id: formId, user: userId });
        if (!form) {
            return res.status(404).json({ error: 'Form not found or does not belong to you' });
        }

        // Check if form has been reviewed or has a plan
        if (form.reviewed || form.planSent) {
            return res.status(403).json({ 
                error: 'Cannot delete a form that has been reviewed or has a plan attached',
                code: 'FORM_PROCESSED'
            });
        }

        // Check if there's an associated plan (extra safety check)
        const existingPlan = await Plan.findOne({ form: formId });
        if (existingPlan) {
            return res.status(403).json({ 
                error: 'Cannot delete a form that has a plan attached',
                code: 'HAS_PLAN'
            });
        }

        // Delete inbody images from Cloudinary if they exist
        const deletePromises = [];
        if (form.inbodyImages && form.inbodyImages.length > 0) {
            for (const imageUrl of form.inbodyImages) {
                const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.\w+$/);
                if (publicIdMatch && publicIdMatch[1]) {
                    deletePromises.push(
                        deleteImage(publicIdMatch[1]).catch(err => 
                            console.error(`Failed to delete image ${publicIdMatch[1]}:`, err)
                        )
                    );
                }
            }
        }

        // Delete form and images in parallel
        deletePromises.push(Form.findByIdAndDelete(formId));
        await Promise.all(deletePromises);

        // Refund form credit if payments are enabled
        const paymentsEnabled = process.env.ENABLE_PAYMENTS !== 'false';
        let creditsRefunded = false;
        
        if (paymentsEnabled && req.user.role !== 'admin') {
            await User.findByIdAndUpdate(userId, { $inc: { formCredits: 1 } });
            creditsRefunded = true;
        }

        // Invalidate dashboard cache
        cache.delete(CacheKeys.dashboardStats());

        res.status(200).json({ 
            message: 'Form deleted successfully',
            creditsRefunded
        });
    } catch (error) {
        console.error('Error in deleteMyForm:', error);
        res.status(500).json({ error: error.message || 'Failed to delete form' });
    }
}

