import express from 'express';;
const router = express.Router();
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Form from '../models/Form.js';
import Plan from '../models/Plan.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import bcrypt from 'bcryptjs';
import { upload, uploadToCloudinary, deleteImage } from '../config/cloudinary.js';
import { adminAuth } from '../config/firebase.js';

const PHOTO_CHANGE_COOLDOWN = 5 * 60 * 1000;

const checkPhotoChangeTimeout = (lastChangeAt) => {
    if (!lastChangeAt) {
        return { canChange: true, remainingSeconds: 0 };
    }
    
    const timeSinceLastChange = Date.now() - lastChangeAt.getTime();
    if (timeSinceLastChange < PHOTO_CHANGE_COOLDOWN) {
        const remainingTime = Math.ceil((PHOTO_CHANGE_COOLDOWN - timeSinceLastChange) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return {
            canChange: false,
            remainingSeconds: remainingTime,
            errorMessage: `Please wait ${minutes}m ${seconds}s before changing your profile photo again`
        };
    }
    
    return { canChange: true, remainingSeconds: 0 };
};

router.get('/profile', protect, async (req, res) => {
    return res.status(200).json({
        user: {
            _id: req.user._id,
            firebaseUid: req.user.firebaseUid,
            name: req.user.name,
            email: req.user.email,
            dateOfBirth: req.user.dateOfBirth,
            isMother: req.user.isMother,
            gender: req.user.gender,
            role: req.user.role,
            profileImageUrl: req.user.profileImageUrl,
            createdAt: req.user.createdAt
        }
    });
});

router.put('/profile', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, dateOfBirth, isMother, gender, currentPassword, newPassword } = req.body;
        
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updateData = {};
        
        if (name !== undefined) updateData.name = name;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        if (isMother !== undefined) updateData.isMother = isMother;
        if (gender !== undefined) updateData.gender = gender;

        if (newPassword && user.isFirebaseUser === false) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new password' });
            }
            
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        } else if (newPassword && user.isFirebaseUser) {
            return res.status(400).json({ error: 'Password updates for Firebase users must be done through Firebase' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        );

        const userResponse = {
            _id: updatedUser._id,
            firebaseUid: updatedUser.firebaseUid,
            name: updatedUser.name,
            email: updatedUser.email,
            dateOfBirth: updatedUser.dateOfBirth,
            isMother: updatedUser.isMother,
            gender: updatedUser.gender,
            role: updatedUser.role,
            profileImageUrl: updatedUser.profileImageUrl
        };

        res.status(200).json({
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload profile photo
router.post('/profile/upload-photo', protect, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const timeoutCheck = checkPhotoChangeTimeout(user.lastProfileImageChangeAt);
        if (!timeoutCheck.canChange) {
            return res.status(429).json({ 
                error: timeoutCheck.errorMessage,
                remainingSeconds: timeoutCheck.remainingSeconds
            });
        }

        // Delete existing profile image if it exists
        if (user.profileImagePublicId) {
            try {
                await deleteImage(user.profileImagePublicId);
            } catch (deleteError) {
                console.error('Error deleting old profile image:', deleteError);
            }
        }

        const filename = `user-${userId}-${Date.now()}`;
        
        const result = await uploadToCloudinary(req.file.buffer, filename);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profileImageUrl: result.secure_url,
                profileImagePublicId: result.public_id,
                lastProfileImageChangeAt: new Date()
            },
            { new: true }
        );

        const userResponse = {
            _id: updatedUser._id,
            firebaseUid: updatedUser.firebaseUid,
            name: updatedUser.name,
            email: updatedUser.email,
            dateOfBirth: updatedUser.dateOfBirth,
            isMother: updatedUser.isMother,
            gender: updatedUser.gender,
            role: updatedUser.role,
            profileImageUrl: updatedUser.profileImageUrl
        };

        res.status(200).json({
            message: 'Profile photo uploaded successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ error: 'Failed to upload profile photo' });
    }
});

// Delete profile photo
router.delete('/profile/photo', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profileImagePublicId) {
            return res.status(400).json({ error: 'No profile photo to delete' });
        }

        const timeoutCheck = checkPhotoChangeTimeout(user.lastProfileImageChangeAt);
        if (!timeoutCheck.canChange) {
            return res.status(429).json({ 
                error: timeoutCheck.errorMessage,
                remainingSeconds: timeoutCheck.remainingSeconds
            });
        }

        try {
            await deleteImage(user.profileImagePublicId);
        } catch (deleteError) {
            console.error('Error deleting image from Cloudinary:', deleteError);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profileImageUrl: null,
                profileImagePublicId: null,
                lastProfileImageChangeAt: new Date()
            },
            { new: true }
        );

        const userResponse = {
            _id: updatedUser._id,
            firebaseUid: updatedUser.firebaseUid,
            name: updatedUser.name,
            email: updatedUser.email,
            dateOfBirth: updatedUser.dateOfBirth,
            isMother: updatedUser.isMother,
            gender: updatedUser.gender,
            role: updatedUser.role,
            profileImageUrl: updatedUser.profileImageUrl
        };

        res.status(200).json({
            message: 'Profile photo deleted successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error deleting profile photo:', error);
        res.status(500).json({ error: 'Failed to delete profile photo' });
    }
});

router.get('/profile/photo-timeout', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const timeoutCheck = checkPhotoChangeTimeout(user.lastProfileImageChangeAt);

        res.status(200).json({
            canChange: timeoutCheck.canChange,
            remainingSeconds: timeoutCheck.remainingSeconds,
            lastChangeAt: user.lastProfileImageChangeAt
        });
    } catch (error) {
        console.error('Error checking photo timeout:', error);
        res.status(500).json({ error: 'Failed to check photo timeout status' });
    }
});

// Delete user account
router.delete('/profile', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;
        
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.firebaseUid && !password) {
            return res.status(400).json({ error: 'Password is required to delete your account' });
        }

        if (!user.firebaseUid && password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Incorrect password' });
            }
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
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

export default router;
