import express from 'express';;
const router = express.Router();
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

router.get('/profile', protect, async (req, res) => {
    return res.status(200).json({user: req.user});
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
            role: updatedUser.role
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

export default router;
