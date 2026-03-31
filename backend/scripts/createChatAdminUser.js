import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const CHAT_ADMIN_EMAIL = process.env.CHAT_ADMIN_EMAIL;
const CHAT_ADMIN_PASSWORD = process.env.CHAT_ADMIN_PASSWORD;
const CHAT_ADMIN_NAME = process.env.CHAT_ADMIN_NAME;

function promptYesNo(question) {
    return new Promise(async (resolve) => {
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            const normalized = String(answer || '').trim().toLowerCase();
            resolve(normalized === 'y' || normalized === 'yes');
        });
    });
}

async function createChatAdminUser() {
    await mongoose.connect(process.env.MONGO_URI);

    try {

        const email = CHAT_ADMIN_EMAIL.toLowerCase().trim();

        const existingByEmail = await User.findOne({ email }).select('+password');

        if (existingByEmail) {
            const isExistingChatAdmin = existingByEmail.role === 'chat_admin' && existingByEmail.isFirebaseUser === false;
            if (!isExistingChatAdmin) {
                console.error(
                    `A user already exists with email ${CHAT_ADMIN_EMAIL} but is not a local chat admin. ` +
                    'Use a different CHAT_ADMIN_EMAIL.'
                );
                process.exitCode = 1;
                return;
            }

            console.log('Chat admin already exists with email:', CHAT_ADMIN_EMAIL);

            const shouldUpdate = await promptYesNo('Do you want to update the chat admin password? (y/N): ');
            if (shouldUpdate) {
                const hashedPassword = await bcrypt.hash(CHAT_ADMIN_PASSWORD, 12);
                await User.findByIdAndUpdate(existingByEmail._id, {
                    password: hashedPassword
                });
                console.log('Chat admin password updated successfully!');
            } else {
                console.log('Chat admin user unchanged.');
            }

            return;
        }

        const hashedPassword = await bcrypt.hash(CHAT_ADMIN_PASSWORD, 12);

        const chatAdminUser = new User({
            email,
            password: hashedPassword,
            name: CHAT_ADMIN_NAME || 'carina_chat_admin',
            role: 'chat_admin',
            isFirebaseUser: false,
            dateOfBirth: null,
            isMother: false,
            gender: null
        });

        await chatAdminUser.save();

        console.log('Chat admin user created successfully!');
        console.log('Email:', CHAT_ADMIN_EMAIL);
        console.log('Password:', CHAT_ADMIN_PASSWORD);
    } catch (error) {
        console.error('Error creating chat admin user:', error.message);

        if (error.code === 11000) {
            const key = error?.keyPattern ? Object.keys(error.keyPattern)[0] : undefined;
            if (key === 'email') {
                console.log('User with this email already exists. Please check existing users.');
            } else if (key === 'firebaseUid') {
                console.log(
                    'Duplicate firebaseUid detected. If you have a unique index on firebaseUid that is not sparse, ' +
                    'you may need to drop/recreate it as unique+sparse, or ensure local users do not store firebaseUid.'
                );
            } else {
                console.log('Duplicate key error. Please check existing users/indexes.');
            }
        }
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

function validateCredentials() {
    if (!CHAT_ADMIN_EMAIL || !CHAT_ADMIN_EMAIL.includes('@')) {
        console.error('Invalid chat admin email. Please set CHAT_ADMIN_EMAIL environment variable or modify the script.');
        process.exit(1);
    }

    if (!CHAT_ADMIN_PASSWORD || CHAT_ADMIN_PASSWORD.length < 8) {
        console.error('Chat admin password must be at least 8 characters long.');
        process.exit(1);
    }

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI environment variable is required.');
        process.exit(1);
    }
}

console.log('Creating Carina Chat Admin User...\n');
validateCredentials();
createChatAdminUser();
