import User from '../models/User.js';
import Form from '../models/Form.js';
import Plan from '../models/Plan.js';
export async function getDashboardStats(req, res) {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalForms = await Form.countDocuments();
        const pendingForms = await Form.countDocuments({ reviewed: false });
        const recentUsers = await User.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email createdAt');

        const recentForms = await Form.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);


        res.status(200).json({
            totalUsers,
            totalForms,
            pendingForms,
            recentUsers,
            recentForms
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getAllUsersAdmin(req, res) {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const query = { role: 'user' };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
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
        const { page = 1, limit = 10, reviewed, userId } = req.query;
        const query = {};
        
        if (reviewed !== undefined) {
            query.reviewed = reviewed === 'true';
        }
        
        if (userId) {
            query.user = userId;
        }

        const forms = await Form.find(query)
            .populate('user', 'name email dateOfBirth gender')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Form.countDocuments(query);

        res.status(200).json({
            forms,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

export async function markFormReviewed(req, res) {
    try {
        const { formId } = req.params;
        
        const form = await Form.findByIdAndUpdate(
            formId,
            { reviewed: true },
            { new: true }
        ).populate('user', 'name email');

        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.status(200).json({ message: 'Form marked as reviewed', form });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
