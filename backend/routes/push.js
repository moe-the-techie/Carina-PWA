import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Register a device for push notifications
 * POST /api/push/register
 */
router.post('/push/register', protect, async (req, res) => {
    try {
        const { deviceId, platform, userAgent } = req.body;
        const userId = req.user._id;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Store device info in user document
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Initialize pushDevices array if not exists
        if (!user.pushDevices) {
            user.pushDevices = [];
        }

        // Check if device already registered
        const existingDeviceIndex = user.pushDevices.findIndex(d => d.deviceId === deviceId);
        
        const deviceInfo = {
            deviceId,
            platform: platform || 'web',
            userAgent: userAgent || '',
            registeredAt: new Date(),
            lastActiveAt: new Date()
        };

        if (existingDeviceIndex >= 0) {
            // Update existing device
            user.pushDevices[existingDeviceIndex] = deviceInfo;
        } else {
            // Add new device (limit to 5 devices per user)
            if (user.pushDevices.length >= 5) {
                // Remove oldest device
                user.pushDevices.sort((a, b) => new Date(a.lastActiveAt) - new Date(b.lastActiveAt));
                user.pushDevices.shift();
            }
            user.pushDevices.push(deviceInfo);
        }

        await user.save();

        console.log(`Device ${deviceId} registered for user ${userId}`);
        res.status(200).json({ 
            success: true, 
            message: 'Device registered successfully',
            deviceCount: user.pushDevices.length
        });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: 'Failed to register device' });
    }
});

/**
 * Unregister a device from push notifications
 * DELETE /api/push/unregister
 */
router.delete('/push/unregister', protect, async (req, res) => {
    try {
        const { deviceId } = req.body;
        const userId = req.user._id;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.pushDevices) {
            user.pushDevices = user.pushDevices.filter(d => d.deviceId !== deviceId);
            await user.save();
        }

        console.log(`Device ${deviceId} unregistered for user ${userId}`);
        res.status(200).json({ 
            success: true, 
            message: 'Device unregistered successfully' 
        });
    } catch (error) {
        console.error('Error unregistering device:', error);
        res.status(500).json({ error: 'Failed to unregister device' });
    }
});

/**
 * Get registered devices for current user
 * GET /api/push/devices
 */
router.get('/push/devices', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('pushDevices');
        
        res.status(200).json({
            devices: user?.pushDevices || [],
            count: user?.pushDevices?.length || 0
        });
    } catch (error) {
        console.error('Error getting devices:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
});

/**
 * Update device activity timestamp
 * PUT /api/push/heartbeat
 */
router.put('/push/heartbeat', protect, async (req, res) => {
    try {
        const { deviceId } = req.body;
        const userId = req.user._id;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        await User.updateOne(
            { _id: userId, 'pushDevices.deviceId': deviceId },
            { $set: { 'pushDevices.$.lastActiveAt': new Date() } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});

export default router;
