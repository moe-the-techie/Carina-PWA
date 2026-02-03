import cron from 'node-cron';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { sendPushNotification } from '../config/ably.js';

/**
 * Check for plans that need reminders (6 days old) and send notifications
 */
async function sendPlanReminders() {
    try {
        const now = new Date();
        
        // Calculate the date 6 days ago (for plans that are 6 days old)
        const sixDaysAgo = new Date(now);
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        sixDaysAgo.setHours(0, 0, 0, 0);
        
        const sixDaysAgoEnd = new Date(sixDaysAgo);
        sixDaysAgoEnd.setHours(23, 59, 59, 999);

        // Find active plans that were activated 6 days ago and haven't received a reminder
        const plansNeedingReminder = await Plan.find({
            status: 'active',
            activatedAt: {
                $gte: sixDaysAgo,
                $lte: sixDaysAgoEnd
            },
            reminderSentAt: { $exists: false }
        }).populate('user', 'name email pushDevices');

        console.log(`[Plan Reminder Service] Found ${plansNeedingReminder.length} plans needing reminders`);

        for (const plan of plansNeedingReminder) {
            if (!plan.user) {
                console.warn(`[Plan Reminder Service] Plan ${plan._id} has no user, skipping`);
                continue;
            }

            // Send push notification
            const notification = {
                title: '⏰ Plan Reminder',
                body: `Your current plan "${plan.title}" is ending soon! Submit a new form to get your next week's plan.`,
                icon: '/icons/manifest-icon-192.maskable.png',
                data: {
                    type: 'plan-reminder',
                    planId: plan._id.toString(),
                    url: '/active-plans'
                }
            };

            try {
                await sendPushNotification(plan.user._id.toString(), notification);
                
                // Mark reminder as sent
                plan.reminderSentAt = now;
                await plan.save();
                
                console.log(`[Plan Reminder Service] Sent reminder to user ${plan.user.email} for plan ${plan._id}`);
            } catch (error) {
                console.error(`[Plan Reminder Service] Error sending notification to user ${plan.user._id}:`, error);
            }
        }
    } catch (error) {
        console.error('[Plan Reminder Service] Error in sendPlanReminders:', error);
    }
}

/**
 * Check for plans that have expired (7+ days old) and update their status
 */
async function updateExpiredPlans() {
    try {
        const now = new Date();
        
        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(23, 59, 59, 999);

        // Find active plans that were activated 7 or more days ago
        const expiredPlans = await Plan.find({
            status: 'active',
            activatedAt: {
                $lte: sevenDaysAgo
            }
        }).populate('user', 'name email');

        console.log(`[Plan Reminder Service] Found ${expiredPlans.length} expired plans to update`);

        for (const plan of expiredPlans) {
            // Calculate completion percentage
            const progressPercentage = plan.calculateProgress ? plan.calculateProgress() : 0;
            
            // If user has made significant progress, mark as completed
            // Otherwise mark as paused (they may want to continue later)
            if (progressPercentage >= 50) {
                plan.status = 'completed';
                plan.completedAt = now;
                console.log(`[Plan Reminder Service] Marking plan ${plan._id} as completed (${progressPercentage}% progress)`);
            } else {
                plan.status = 'paused';
                console.log(`[Plan Reminder Service] Marking plan ${plan._id} as paused (${progressPercentage}% progress)`);
            }

            // Set expiration date
            if (!plan.expiresAt) {
                plan.expiresAt = now;
            }

            await plan.save();

            // Send notification about plan status change
            if (plan.user) {
                const notification = {
                    title: plan.status === 'completed' ? '🎉 Plan Completed!' : '⏸️ Plan Paused',
                    body: plan.status === 'completed' 
                        ? `Great job! Your plan "${plan.title}" has been completed. Ready for your next challenge?`
                        : `Your plan "${plan.title}" has been paused. Submit a new form to get a fresh plan!`,
                    icon: '/icons/manifest-icon-192.maskable.png',
                    data: {
                        type: 'plan-status-update',
                        planId: plan._id.toString(),
                        status: plan.status,
                        url: '/active-plans'
                    }
                };

                try {
                    await sendPushNotification(plan.user._id.toString(), notification);
                    console.log(`[Plan Reminder Service] Sent status update notification to user ${plan.user.email}`);
                } catch (error) {
                    console.error(`[Plan Reminder Service] Error sending status update to user ${plan.user._id}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('[Plan Reminder Service] Error in updateExpiredPlans:', error);
    }
}

/**
 * Initialize and start the cron jobs
 */
export function startPlanReminderService() {
    console.log('[Plan Reminder Service] Starting plan reminder and status update service...');
    
    // Run every day at 9:00 AM to send reminders for 6-day-old plans
    cron.schedule('0 9 * * *', async () => {
        console.log('[Plan Reminder Service] Running daily reminder check at', new Date().toISOString());
        await sendPlanReminders();
    });

    // Run every day at 10:00 AM to update expired plans (7+ days old)
    cron.schedule('0 10 * * *', async () => {
        console.log('[Plan Reminder Service] Running daily expired plan check at', new Date().toISOString());
        await updateExpiredPlans();
    });

    // Optional: Run immediately on startup for testing (comment out in production)
    // setTimeout(async () => {
    //     console.log('[Plan Reminder Service] Running initial check on startup...');
    //     await sendPlanReminders();
    //     await updateExpiredPlans();
    // }, 5000);

    console.log('[Plan Reminder Service] Cron jobs scheduled:');
    console.log('  - Reminder check: Daily at 9:00 AM');
    console.log('  - Status update check: Daily at 10:00 AM');
}

/**
 * Export functions for manual triggering (e.g., from admin panel or testing)
 */
export { sendPlanReminders, updateExpiredPlans };
