import cron from 'node-cron';
import Plan from '../models/Plan.js';
import { publishMessage } from '../config/ably.js';

// Batch size for concurrent operations
const BATCH_SIZE = 10;

/**
 * Process items in batches with concurrency control
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} batchSize - Number of concurrent operations
 */
async function processBatch(items, processor, batchSize = BATCH_SIZE) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(processor));
        results.push(...batchResults);
    }
    return results;
}

/**
 * Check for plans that need reminders (6 days old) and send notifications
 * OPTIMIZED: Uses batch processing and bulk updates
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
        // Use lean() for better performance since we only need to read data
        const plansNeedingReminder = await Plan.find({
            status: 'active',
            activatedAt: {
                $gte: sixDaysAgo,
                $lte: sixDaysAgoEnd
            },
            reminderSentAt: { $exists: false }
        })
        .populate('user', 'name email _id')
        .lean();

        console.log(`[Plan Reminder Service] Found ${plansNeedingReminder.length} plans needing reminders`);

        if (plansNeedingReminder.length === 0) return;

        // Filter out plans without users
        const validPlans = plansNeedingReminder.filter(plan => plan.user);
        const planIdsToUpdate = [];

        // Process notifications in batches
        await processBatch(validPlans, async (plan) => {
            const notification = {
                title: '⏰ Plan Reminder',
                body: `Your current plan "${plan.title}" is ending soon! Submit a new form to get your next week's plan.`,
                icon: '/icons/manifest-icon-192.maskable.png',
                type: 'plan-reminder',
                planId: plan._id.toString(),
                url: '/active-plans'
            };

            try {
                await publishMessage(`plans:${plan.user._id}`, 'plan-reminder', notification);
                planIdsToUpdate.push(plan._id);
                console.log(`[Plan Reminder Service] Sent reminder to user ${plan.user.email} for plan ${plan._id}`);
            } catch (error) {
                console.error(`[Plan Reminder Service] Error sending notification to user ${plan.user._id}:`, error);
            }
        });

        // Bulk update all plans that were successfully notified
        if (planIdsToUpdate.length > 0) {
            await Plan.updateMany(
                { _id: { $in: planIdsToUpdate } },
                { $set: { reminderSentAt: now } }
            );
            console.log(`[Plan Reminder Service] Bulk updated ${planIdsToUpdate.length} plans`);
        }
    } catch (error) {
        console.error('[Plan Reminder Service] Error in sendPlanReminders:', error);
    }
}

/**
 * Check for plans that have expired (7+ days old) and update their status
 * OPTIMIZED: Uses bulk operations for better performance
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
        }).populate('user', 'name email _id');

        console.log(`[Plan Reminder Service] Found ${expiredPlans.length} expired plans to update`);

        if (expiredPlans.length === 0) return;

        // Prepare bulk operations
        const bulkOps = [];
        const notificationPromises = [];

        for (const plan of expiredPlans) {
            // Calculate completion percentage
            const progressPercentage = plan.calculateProgress ? plan.calculateProgress() : 0;
            
            const newStatus = progressPercentage >= 50 ? 'completed' : 'paused';
            const updateData = {
                status: newStatus,
                expiresAt: plan.expiresAt || now
            };
            
            if (newStatus === 'completed') {
                updateData.completedAt = now;
            }

            // Add to bulk operations
            bulkOps.push({
                updateOne: {
                    filter: { _id: plan._id },
                    update: { $set: updateData }
                }
            });

            console.log(`[Plan Reminder Service] Marking plan ${plan._id} as ${newStatus} (${progressPercentage}% progress)`);

            // Queue notification if user exists
            if (plan.user) {
                const notification = {
                    title: newStatus === 'completed' ? '🎉 Plan Completed!' : '⏸️ Plan Paused',
                    body: newStatus === 'completed' 
                        ? `Great job! Your plan "${plan.title}" has been completed. Ready for your next challenge?`
                        : `Your plan "${plan.title}" has been paused. Submit a new form to get a fresh plan!`,
                    icon: '/icons/manifest-icon-192.maskable.png',
                    type: 'plan-status-update',
                    planId: plan._id.toString(),
                    status: newStatus,
                    url: '/active-plans'
                };

                notificationPromises.push(
                    publishMessage(`plans:${plan.user._id}`, 'plan-status-update', notification)
                        .then(() => console.log(`[Plan Reminder Service] Sent status update to ${plan.user.email}`))
                        .catch(err => console.error(`[Plan Reminder Service] Failed to notify ${plan.user._id}:`, err))
                );
            }
        }

        // Execute bulk update and notifications concurrently
        await Promise.all([
            bulkOps.length > 0 ? Plan.bulkWrite(bulkOps) : Promise.resolve(),
            ...notificationPromises
        ]);

        console.log(`[Plan Reminder Service] Bulk updated ${bulkOps.length} expired plans`);
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
