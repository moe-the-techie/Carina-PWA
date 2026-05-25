import User from '../models/User.js';
import Form from '../models/Form.js';
import Plan from '../models/Plan.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import UserClass from '../models/UserClass.js';
import Payment from '../models/Payment.js';
import PaymentSettings from '../models/PaymentSettings.js';
import fawaterkConfig from '../config/fawaterk.js';
import { deleteImage } from '../config/cloudinary.js';
import { adminAuth } from '../config/firebase.js';
import { sendPlanReminders, updateExpiredPlans } from '../services/planReminderService.js';
import cache, { CacheKeys, CacheTTL } from '../config/cache.js';

function getEffectivePaymentPackageSettings(settingsDoc) {
    const firstTimePrice = settingsDoc?.firstTime?.price ?? null;
    const firstTimeForms = settingsDoc?.firstTime?.formsPerPackage ?? null;
    const followUpPrice = settingsDoc?.followUp?.price ?? null;
    const followUpForms = settingsDoc?.followUp?.formsPerPackage ?? null;

    return {
        firstTime: {
            price: typeof firstTimePrice === 'number' ? firstTimePrice : fawaterkConfig.firstTimePackagePrice,
            formsPerPackage: typeof firstTimeForms === 'number' ? firstTimeForms : fawaterkConfig.firstTimeFormsPerPackage
        },
        followUp: {
            price: typeof followUpPrice === 'number' ? followUpPrice : fawaterkConfig.followUpPackagePrice,
            formsPerPackage: typeof followUpForms === 'number' ? followUpForms : fawaterkConfig.followUpFormsPerPackage
        },
        firstTimeResetEnabled: settingsDoc?.firstTimeResetEnabled === true,
        firstTimeResetAfterDays: typeof settingsDoc?.firstTimeResetAfterDays === 'number'
            ? settingsDoc.firstTimeResetAfterDays
            : 60,
        currency: fawaterkConfig.currency
    };
}

export async function getPaymentPackageSettingsAdmin(req, res) {
    try {
        const settingsDoc = await PaymentSettings.findOne({ key: 'payment_packages' })
            .populate('updatedBy', 'name email')
            .lean();

        const effective = getEffectivePaymentPackageSettings(settingsDoc);

        res.status(200).json({
            settings: effective,
            savedSettings: settingsDoc ? {
                firstTime: settingsDoc.firstTime,
                followUp: settingsDoc.followUp,
                updatedAt: settingsDoc.updatedAt,
                updatedBy: settingsDoc.updatedBy
            } : null
        });
    } catch (error) {
        console.error('Error fetching payment package settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function updatePaymentPackageSettingsAdmin(req, res) {
    try {
        const {
            firstTimePrice,
            firstTimeFormsPerPackage,
            followUpPrice,
            followUpFormsPerPackage,
            firstTimeResetEnabled,
            firstTimeResetAfterDays
        } = req.body || {};

        const update = {
            updatedBy: req.user?._id || null,
            updatedAt: new Date()
        };

        if (firstTimePrice !== undefined) {
            const value = Number(firstTimePrice);
            if (Number.isNaN(value) || value < 0) {
                return res.status(400).json({ message: 'Invalid firstTimePrice' });
            }
            update['firstTime.price'] = value;
        }

        if (firstTimeFormsPerPackage !== undefined) {
            const value = Number(firstTimeFormsPerPackage);
            if (Number.isNaN(value) || value < 1) {
                return res.status(400).json({ message: 'Invalid firstTimeFormsPerPackage' });
            }
            update['firstTime.formsPerPackage'] = Math.floor(value);
        }

        if (followUpPrice !== undefined) {
            const value = Number(followUpPrice);
            if (Number.isNaN(value) || value < 0) {
                return res.status(400).json({ message: 'Invalid followUpPrice' });
            }
            update['followUp.price'] = value;
        }

        if (followUpFormsPerPackage !== undefined) {
            const value = Number(followUpFormsPerPackage);
            if (Number.isNaN(value) || value < 1) {
                return res.status(400).json({ message: 'Invalid followUpFormsPerPackage' });
            }
            update['followUp.formsPerPackage'] = Math.floor(value);
        }

        if (firstTimeResetEnabled !== undefined) {
            update.firstTimeResetEnabled = Boolean(firstTimeResetEnabled);
        }

        if (firstTimeResetAfterDays !== undefined) {
            const value = Number(firstTimeResetAfterDays);
            if (Number.isNaN(value) || value < 1) {
                return res.status(400).json({ message: 'Invalid firstTimeResetAfterDays' });
            }
            update.firstTimeResetAfterDays = Math.floor(value);
        }

        const updatedDoc = await PaymentSettings.findOneAndUpdate(
            { key: 'payment_packages' },
            { $set: update, $setOnInsert: { key: 'payment_packages', createdAt: new Date() } },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        const effective = getEffectivePaymentPackageSettings(updatedDoc);

        res.status(200).json({
            message: 'Payment package settings updated',
            settings: effective
        });
    } catch (error) {
        console.error('Error updating payment package settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Dashboard stats with caching - reduces DB load significantly
export async function getDashboardStats(req, res) {
    try {
        // Try to get cached stats first
        const cacheKey = CacheKeys.dashboardStats();
        const cached = cache.get(cacheKey);
        
        if (cached) {
            return res.status(200).json(cached);
        }

        // Run all count queries in parallel for better performance
        const [
            totalUsers,
            totalForms,
            pendingForms,
            activePlans,
            totalPlans,
            recentUsers,
            recentForms,
            recentActivePlans
        ] = await Promise.all([
            User.countDocuments({ role: 'user', isVerified: true }),
            Form.countDocuments(),
            Form.countDocuments({ reviewed: false }),
            Plan.countDocuments({ status: 'active' }),
            Plan.countDocuments(),
            User.find({ role: 'user', isVerified: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email createdAt profileImageUrl')
                .lean(),
            Form.find()
                .populate('user', 'name email dateOfBirth gender profileImageUrl isMother phoneNumber profession')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Plan.find({ status: 'active' })
                .populate('user', 'name email dateOfBirth gender profileImageUrl isMother phoneNumber profession')
                .sort({ activatedAt: -1 })
                .limit(5)
                .lean()
        ]);

        const stats = {
            totalUsers,
            totalForms,
            pendingForms,
            activePlans,
            totalPlans,
            recentUsers,
            recentForms,
            recentActivePlans
        };

        // Cache for 1 minute
        cache.set(cacheKey, stats, CacheTTL.DASHBOARD);

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getAllUsersAdmin(req, res) {
    try {
        const { page = 1, limit = 10, search = '', classFilter = '', includeUnverified = 'false' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        const query = { role: 'user' };
        
        if (includeUnverified !== 'true') {
            query.isVerified = true;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (classFilter) {
            if (classFilter === 'unassigned') {
                query.userClass = null;
            } else {
                query.userClass = classFilter;
            }
        }

        // Use Promise.all to run find and count in parallel - eliminates double query
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .populate('userClass', 'name color description')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip)
                .lean(),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

export async function getUserDetails(req, res) {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const forms = await Form.find({ user: userId }).sort({ createdAt: -1 });
        const plans = await Plan.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({
            user,
            forms,
            plans
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

export async function getAllFormsAdmin(req, res) {
    try {
        const { page = 1, limit = 10, reviewed, userId, type } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = {};
        
        if (reviewed !== undefined && reviewed !== '') {
            query.reviewed = reviewed === 'true';
        }
        
        if (userId) {
            query.user = userId;
        }

        if (type) {
            if (type === 'new-patient') {
                query.$or = [
                    { type: 'new-patient' },
                    { type: { $exists: false } }, // For backward compatibility
                    { type: null }
                ];
            } else {
                query.type = type;
            }
        }

        // Run find and count in parallel - eliminates the double query
        const [forms, total] = await Promise.all([
            Form.find(query)
                .populate('user', 'name email dateOfBirth gender profileImageUrl isMother phoneNumber profession')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip(skip)
                .lean(),
            Form.countDocuments(query)
        ]);

        res.status(200).json({
            forms,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteUserByAdmin(req, res) {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        if (user.profileImagePublicId) {
            try {
                await deleteImage(user.profileImagePublicId);
            } catch (deleteError) {
                console.error('Error deleting profile image:', deleteError);
            }
        }

        // Delete all related data
        try {
            await Form.deleteMany({ user: userId });
            await Plan.deleteMany({ userId: userId });
            
            const userChat = await Chat.findOne({ userId: userId });
            if (userChat) {
                await Message.deleteMany({ chatId: userChat._id });
                await Chat.findByIdAndDelete(userChat._id);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up related data:', cleanupError);
        }

        if (user.firebaseUid) {
            try {
                await adminAuth.deleteUser(user.firebaseUid);
                console.log('Successfully deleted Firebase user:', user.firebaseUid);
            } catch (firebaseError) {
                console.error('Error deleting Firebase user:', firebaseError);
            }
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
}

export async function banUserByAdmin(req, res) {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot ban admin users' });
        }

        if (user.isBanned) {
            return res.status(400).json({ error: 'User is already banned' });
        }

        if (user.profileImagePublicId) {
            try {
                await deleteImage(user.profileImagePublicId);
            } catch (deleteError) {
                console.error('Error deleting profile image:', deleteError);
            }
        }

        // Delete all related data
        try {
            await Form.deleteMany({ user: userId });
            await Plan.deleteMany({ userId: userId });
            
            const userChat = await Chat.findOne({ userId: userId });
            if (userChat) {
                await Message.deleteMany({ chatId: userChat._id });
                await Chat.findByIdAndDelete(userChat._id);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up related data:', cleanupError);
        }

        if (user.firebaseUid) {
            try {
                await adminAuth.deleteUser(user.firebaseUid);
                console.log('Successfully deleted Firebase user:', user.firebaseUid);
            } catch (firebaseError) {
                console.error('Error deleting Firebase user:', firebaseError);
            }
        }

        user.isBanned = true;
        user.bannedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'User banned successfully',
            user: {
                _id: user._id,
                email: user.email,
                isBanned: user.isBanned,
                bannedAt: user.bannedAt
            }
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Failed to ban user' });
    }
}

// User Class Management
export async function getAllUserClasses(req, res) {
    try {
        const classes = await UserClass.find()
            .sort({ order: 1, name: 1 });

        res.status(200).json({ classes });
    } catch (error) {
        console.error('Error fetching user classes:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getUserClassById(req, res) {
    try {
        const { classId } = req.params;
        
        const userClass = await UserClass.findById(classId);
        
        if (!userClass) {
            return res.status(404).json({ error: 'User class not found' });
        }

        const userCount = await User.countDocuments({ userClass: classId });

        res.status(200).json({ 
            userClass,
            userCount
        });
    } catch (error) {
        console.error('Error fetching user class:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function createUserClass(req, res) {
    try {
        const { name, description, color, icon, order } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Class name is required' });
        }

        const existingClass = await UserClass.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });

        if (existingClass) {
            return res.status(400).json({ error: 'A class with this name already exists' });
        }

        const userClass = new UserClass({
            name: name.trim(),
            description: description?.trim() || '',
            color: color || '#1976d2',
            icon: icon || null,
            order: order || 0
        });

        await userClass.save();

        res.status(201).json({ 
            message: 'User class created successfully',
            userClass 
        });
    } catch (error) {
        console.error('Error creating user class:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateUserClass(req, res) {
    try {
        const { classId } = req.params;
        const { name, description, color, icon, order, isActive } = req.body;

        const userClass = await UserClass.findById(classId);
        
        if (!userClass) {
            return res.status(404).json({ error: 'User class not found' });
        }

        if (name && name.trim() !== userClass.name) {
            const existingClass = await UserClass.findOne({ 
                _id: { $ne: classId },
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
            });

            if (existingClass) {
                return res.status(400).json({ error: 'A class with this name already exists' });
            }
            userClass.name = name.trim();
        }

        if (description !== undefined) userClass.description = description.trim();
        if (color !== undefined) userClass.color = color;
        if (icon !== undefined) userClass.icon = icon;
        if (order !== undefined) userClass.order = order;
        if (isActive !== undefined) userClass.isActive = isActive;

        await userClass.save();

        res.status(200).json({ 
            message: 'User class updated successfully',
            userClass 
        });
    } catch (error) {
        console.error('Error updating user class:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteUserClass(req, res) {
    try {
        const { classId } = req.params;
        
        const userClass = await UserClass.findById(classId);
        
        if (!userClass) {
            return res.status(404).json({ error: 'User class not found' });
        }

        // Unassign class from all users
        await User.updateMany(
            { userClass: classId },
            { $set: { userClass: null } }
        );

        await UserClass.findByIdAndDelete(classId);

        res.status(200).json({ 
            message: 'User class deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user class:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function assignUserClass(req, res) {
    try {
        const { userId } = req.params;
        const { classId } = req.body;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (classId) {
            const userClass = await UserClass.findById(classId);
            
            if (!userClass) {
                return res.status(404).json({ error: 'User class not found' });
            }

            if (!userClass.isActive) {
                return res.status(400).json({ error: 'Cannot assign inactive class' });
            }
        }

        user.userClass = classId || null;
        await user.save();

        const updatedUser = await User.findById(userId)
            .select('-password')
            .populate('userClass', 'name color description');

        res.status(200).json({ 
            message: classId ? 'User class assigned successfully' : 'User class removed successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error assigning user class:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getAllPaymentsAdmin(req, res) {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            // Find users matching search first
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            if (users.length > 0) {
                 query.$or = [
                    { user: { $in: users.map(u => u._id) } },
                    { fawaterkInvoiceId: { $regex: search, $options: 'i' } },
                    { fawaterkInvoiceKey: { $regex: search, $options: 'i' } }
                 ];
            } else {
                 query.$or = [
                     { fawaterkInvoiceId: { $regex: search, $options: 'i' } },
                     { fawaterkInvoiceKey: { $regex: search, $options: 'i' } }
                 ];
            }
        }

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        res.json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalPayments: total
        });
    } catch (error) {
        console.error('Error fetching all payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function verifyPaymentAdmin(req, res) {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (!payment.fawaterkInvoiceId) {
             return res.status(400).json({ message: 'Payment has no invoice ID to verify' });
        }
        
        // Call Fawaterk API
        const response = await fetch(
            `${fawaterkConfig.baseUrl}${fawaterkConfig.paymentStatusEndpoint}${payment.fawaterkInvoiceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${fawaterkConfig.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const statusData = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                message: 'Failed to fetch status from Fawaterk', 
                details: statusData 
            });
        }

        const fawaterkStatus = statusData.data?.status_text?.toLowerCase() || statusData.data?.payment_status?.toLowerCase();
        let updated = false;
        let message = 'Payment status matches (or no change needed)';

        // Logic to update status if different - use atomic updates to prevent race conditions
        if ((fawaterkStatus === 'paid' || fawaterkStatus === 'success' || fawaterkStatus === 'successful') && payment.status !== 'paid') {
            // Use atomic update to prevent race conditions and duplicate credit additions
            const updatedPayment = await Payment.findOneAndUpdate(
                { _id: payment._id, status: { $ne: 'paid' } },
                {
                    status: 'paid',
                    paidAt: new Date(),
                    fawaterkTransactionId: statusData.data?.transaction_id || payment.fawaterkTransactionId
                },
                { new: true }
            );

            if (updatedPayment) {
                // Only add credits if we successfully transitioned status
                const user = await User.findOneAndUpdate(
                    { _id: payment.user },
                    { $inc: { formCredits: payment.formCredits } },
                    { new: true }
                );
                if (user) {
                    console.log(`Admin verify: Added ${payment.formCredits} form credits to user ${user._id}. New total: ${user.formCredits}`);
                }
                updated = true;
                message = 'Payment updated to PAID and credits added';
            } else {
                // Payment was already paid (possibly by webhook or another process)
                message = 'Payment was already marked as paid (no duplicate credits added)';
            }
        } else if ((fawaterkStatus === 'failed' || fawaterkStatus === 'declined' || fawaterkStatus === 'expired') && payment.status !== 'failed') {
            await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
            updated = true;
            message = 'Payment updated to FAILED';
        }

        res.json({
            message,
            localStatus: payment.status,
            fawaterkStatus: fawaterkStatus,
            fawaterkData: statusData.data,
            updated
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get all active plans with progress details for admin
export async function getAllActivePlansAdmin(req, res) {
    try {
        const { page = 1, limit = 10, search = '', status = 'active' } = req.query;
        const query = {};

        // Filter by status (default to active, can be 'all' for all statuses)
        if (status !== 'all') {
            query.status = status;
        }

        // Search by user name or email
        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            if (users.length > 0) {
                query.user = { $in: users.map(u => u._id) };
            } else {
                // Also search by plan title
                query.title = { $regex: search, $options: 'i' };
            }
        }

        const plans = await Plan.find(query)
            .populate('user', 'name email profileImageUrl dateOfBirth gender isMother phoneNumber profession')
            .populate('createdBy', 'name email')
            .populate('form', 'currentWeight desiredWeight createdAt type')
            .sort({ activatedAt: -1, createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Calculate progress for each plan
        const plansWithProgress = plans.map(plan => {
            const planObj = plan.toObject();
            
            // Calculate overall progress percentage
            let overallProgress = 0;
            if (plan.activatedAt && plan.duration) {
                const totalDays = plan.duration * 7;
                const completedDays = (plan.progress || []).filter(p => {
                    const meals = p.mealsCompleted || {};
                    const mealsCompleted = [meals.breakfast, meals.lunch, meals.dinner, meals.snack]
                        .filter(Boolean).length;
                    return mealsCompleted >= 3;
                }).length;
                overallProgress = Math.min(Math.round((completedDays / totalDays) * 100), 100);
            }

            // Calculate days elapsed
            const daysElapsed = plan.activatedAt 
                ? Math.floor((new Date() - new Date(plan.activatedAt)) / (1000 * 60 * 60 * 24))
                : 0;

            // Get recent progress entries
            const recentProgress = (plan.progress || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 7);

            return {
                ...planObj,
                overallProgress,
                daysElapsed,
                totalDays: plan.duration ? plan.duration * 7 : 0,
                daysLogged: (plan.progress || []).length,
                recentProgress,
                // Remove full progress array to reduce payload
                progress: undefined
            };
        });

        const total = await Plan.countDocuments(query);

        res.json({
            plans: plansWithProgress,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Error fetching active plans:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get detailed progress for a specific plan (admin)
export async function getPlanProgressAdmin(req, res) {
    try {
        const { planId } = req.params;
        const { startDate, endDate } = req.query;

        const plan = await Plan.findById(planId)
            .populate('user', 'name email profileImageUrl dateOfBirth gender isMother phoneNumber profession')
            .populate('createdBy', 'name email')
            .populate('form', 'currentWeight desiredWeight createdAt type');

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
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

        // Calculate overall progress percentage
        const totalDays = plan.duration ? plan.duration * 7 : 0;
        const completedDays = (plan.progress || []).filter(p => {
            const meals = p.mealsCompleted || {};
            const mealsCompleted = [meals.breakfast, meals.lunch, meals.dinner, meals.snack]
                .filter(Boolean).length;
            return mealsCompleted >= 3;
        }).length;
        const overallProgress = totalDays > 0 ? Math.min(Math.round((completedDays / totalDays) * 100), 100) : 0;

        // Calculate days elapsed since activation
        const daysElapsed = plan.activatedAt 
            ? Math.floor((new Date() - new Date(plan.activatedAt)) / (1000 * 60 * 60 * 24))
            : 0;

        // Calculate average stats
        const progressEntries = plan.progress || [];
        const avgWaterIntake = progressEntries.length > 0
            ? Math.round(progressEntries.reduce((sum, p) => sum + (p.waterIntake || 0), 0) / progressEntries.length * 10) / 10
            : 0;

        const weightEntries = progressEntries.filter(p => p.weight);
        const weights = weightEntries.map(p => ({ date: p.date, weight: p.weight }));

        // Mood distribution
        const moodCounts = progressEntries.reduce((acc, p) => {
            const mood = p.mood || 'okay';
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            plan: {
                _id: plan._id,
                title: plan.title,
                description: plan.description,
                duration: plan.duration,
                status: plan.status,
                activatedAt: plan.activatedAt,
                completedAt: plan.completedAt,
                createdAt: plan.createdAt,
                goals: plan.goals,
                planType: plan.planType,
                weeklyPlan: plan.weeklyPlan,
                generalPlan: plan.generalPlan,
                fruits: plan.fruits,
                recommendations: plan.recommendations,
                warnings: plan.warnings,
                feedback: plan.feedback,
                user: plan.user,
                createdBy: plan.createdBy,
                form: plan.form
            },
            progress: progressData,
            stats: {
                currentStreak: plan.currentStreak || 0,
                longestStreak: plan.longestStreak || 0,
                overallProgress,
                totalDays,
                daysElapsed,
                daysLogged: progressEntries.length,
                completedDays,
                avgWaterIntake,
                weights,
                moodCounts
            }
        });
    } catch (error) {
        console.error('Error fetching plan progress:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updatePaymentStatusAdmin(req, res) {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        if (!['pending', 'paid', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        const oldStatus = payment.status;
        
        // If trying to set same status, no need to update
        if (oldStatus === status) {
            return res.json({ message: `Payment is already ${status}`, payment });
        }
        
        if (status === 'paid' && oldStatus !== 'paid') {
            // Use atomic update to prevent race conditions and duplicate credit additions
            const updatedPayment = await Payment.findOneAndUpdate(
                { _id: paymentId, status: { $ne: 'paid' } },
                { status: 'paid', paidAt: new Date() },
                { new: true }
            );
            
            if (updatedPayment) {
                // Only add credits if we successfully transitioned status
                const user = await User.findOneAndUpdate(
                    { _id: payment.user },
                    { $inc: { formCredits: payment.formCredits } },
                    { new: true }
                );
                if (user) {
                    console.log(`Admin update: Added ${payment.formCredits} form credits to user ${user._id}. New total: ${user.formCredits}`);
                }
                return res.json({ message: `Payment status updated from ${oldStatus} to ${status}`, payment: updatedPayment });
            } else {
                // Payment status was changed by another process
                const freshPayment = await Payment.findById(paymentId);
                return res.json({ message: `Payment was already marked as ${freshPayment?.status || 'paid'} (no duplicate credits added)`, payment: freshPayment });
            }
        } else if (status === 'refunded' && oldStatus === 'paid') {
            // Use atomic update for refund
            const updatedPayment = await Payment.findOneAndUpdate(
                { _id: paymentId, status: 'paid' },
                { status: 'refunded' },
                { new: true }
            );
            
            if (updatedPayment) {
                // Only deduct credits if we successfully transitioned from paid to refunded
                const user = await User.findOneAndUpdate(
                    { _id: payment.user },
                    { $inc: { formCredits: -payment.formCredits } },
                    { new: true }
                );
                if (user) {
                    // Ensure credits don't go negative (fix if needed)
                    if (user.formCredits < 0) {
                        await User.findByIdAndUpdate(user._id, { formCredits: 0 });
                    }
                    console.log(`Admin refund: Deducted ${payment.formCredits} credits from user ${user._id}. New total: ${Math.max(0, user.formCredits)}`);
                }
                return res.json({ message: `Payment status updated from ${oldStatus} to ${status}`, payment: updatedPayment });
            } else {
                const freshPayment = await Payment.findById(paymentId);
                return res.json({ message: `Payment status changed concurrently, current status: ${freshPayment?.status}`, payment: freshPayment });
            }
        } else {
            // For other status transitions (pending, failed), just update
            payment.status = status;
            await payment.save();
            return res.json({ message: `Payment status updated from ${oldStatus} to ${status}`, payment });
        }

    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// Manually trigger plan reminder checks (for testing/admin use)
export async function triggerPlanReminders(req, res) {
    try {
        await sendPlanReminders();
        res.status(200).json({ 
            message: 'Plan reminder check completed successfully',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error triggering plan reminders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Manually trigger expired plan status updates (for testing/admin use)
export async function triggerExpiredPlanUpdates(req, res) {
    try {
        await updateExpiredPlans();
        res.status(200).json({ 
            message: 'Expired plan status update completed successfully',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error triggering expired plan updates:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

/**
 * Give form credits to a user (Admin only)
 * Supports adding or setting credits
 */
export async function giveFormCredits(req, res) {
    try {
        const { userId } = req.params;
        const { credits, mode = 'add' } = req.body;

        // Validate credits input
        if (credits === undefined || credits === null) {
            return res.status(400).json({ error: 'Credits amount is required' });
        }

        const creditsNum = parseInt(credits);
        if (isNaN(creditsNum) || creditsNum < 0) {
            return res.status(400).json({ error: 'Credits must be a non-negative number' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const previousCredits = user.formCredits || 0;
        let newCredits;

        if (mode === 'set') {
            // Set credits to exact value
            newCredits = creditsNum;
        } else {
            // Add credits (default behavior)
            newCredits = previousCredits + creditsNum;
        }

        // Update user's form credits
        user.formCredits = newCredits;
        await user.save();

        // Invalidate user cache if they're cached
        cache.delete(CacheKeys.userById(userId));

        res.status(200).json({
            message: `Form credits ${mode === 'set' ? 'set to' : 'added successfully'}`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                formCredits: newCredits,
                previousCredits
            },
            creditsAdded: mode === 'add' ? creditsNum : newCredits - previousCredits
        });
    } catch (error) {
        console.error('Error giving form credits:', error);
        res.status(500).json({ error: 'Failed to give form credits' });
    }
}

/**
 * Get user's current form credits (Admin only)
 */
export async function getUserFormCredits(req, res) {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('_id name email formCredits').lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                formCredits: user.formCredits || 0
            }
        });
    } catch (error) {
        console.error('Error getting user form credits:', error);
        res.status(500).json({ error: 'Failed to get user form credits' });
    }
}

/**
 * Bulk give form credits to multiple users (Admin only)
 * Useful for promotions or batch operations
 */
export async function bulkGiveFormCredits(req, res) {
    try {
        const { userIds, credits, mode = 'add' } = req.body;

        // Validate inputs
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds array is required' });
        }

        if (credits === undefined || credits === null) {
            return res.status(400).json({ error: 'Credits amount is required' });
        }

        const creditsNum = parseInt(credits);
        if (isNaN(creditsNum) || creditsNum < 0) {
            return res.status(400).json({ error: 'Credits must be a non-negative number' });
        }

        let result;

        if (mode === 'set') {
            // Set credits to exact value for all users
            result = await User.updateMany(
                { _id: { $in: userIds } },
                { $set: { formCredits: creditsNum } }
            );
        } else {
            // Add credits to all users
            result = await User.updateMany(
                { _id: { $in: userIds } },
                { $inc: { formCredits: creditsNum } }
            );
        }

        // Invalidate cache for all affected users
        for (const userId of userIds) {
            cache.delete(CacheKeys.userById(userId));
        }

        res.status(200).json({
            message: `Form credits ${mode === 'set' ? 'set' : 'added'} for ${result.modifiedCount} users`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            credits: creditsNum,
            mode
        });
    } catch (error) {
        console.error('Error in bulk give form credits:', error);
        res.status(500).json({ error: 'Failed to give form credits in bulk' });
    }
}
