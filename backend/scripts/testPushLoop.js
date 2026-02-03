import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { sendPushNotification } from '../config/ably.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const logFile = path.join(__dirname, '../debug_log.txt');
console.log(`Logging to: ${logFile}`);

const run = async () => {
  try {
    await connectDB();
    
    // Find a user - preferably one with push devices if possible, or just the first user
    // In Ably push, we publish to the clientId (userId), so we just need a valid user ID.
    const user = await User.findOne();
    if (!user) {
      console.log('No users found to test push with.');
      process.exit(1);
    }
    
    console.log(`Starting Push Test Loop for user: ${user.name} (${user._id})`);
    console.log('Press Ctrl+C to stop.');
    
    let count = 0;
    // Send immediately
    sendPing(user, ++count);

    // Then every 5 seconds
    setInterval(() => {
        sendPing(user, ++count);
    }, 5000);

  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

async function sendPing(user, count) {
    const message = `Backend Push Test #${count} at ${new Date().toLocaleTimeString()}`;
    console.log(`Sending: ${message}`);
    
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Sending Push: ${message}\n`);
    } catch (e) {
        console.error('Error writing to log file:', e);
    }

    try {
        const notification = {
            title: 'Backend Push Test',
            body: message,
            data: { 
                testId: count, 
                url: '/',
                timestamp: Date.now()
            }
        };

        // Note: sendPushNotification uses client.push.admin.publish({ clientId: ... }, ...)
        // This requires the device to be subscribed to push for that clientId.
        const result = await sendPushNotification(user._id, notification);
        
        if (result && !result.success) {
             console.error('Failed to send (check Ably config/limits):', result);
        } else {
             console.log('Sent successfully.');
        }
    } catch (err) {
        console.error('Error sending push:', err);
    }
}

run();
