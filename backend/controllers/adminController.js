import User from '../models/User.js';
import Form from '../models/Form.js';

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