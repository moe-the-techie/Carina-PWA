import User from '../models/User.js';
import Form from '../models/Form.js';
import Plan from '../models/Plan.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import UserClass from '../models/UserClass.js';
import { deleteImage } from '../config/cloudinary.js';
import { adminAuth } from '../config/firebase.js';
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
        const { page = 1, limit = 10, search = '', classFilter = '' } = req.query;
        const query = { role: 'user' };
        
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

        const users = await User.find(query)
            .select('-password')
            .populate('userClass', 'name color description')
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
            .populate('user', 'name email dateOfBirth gender profileImageUrl')
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
