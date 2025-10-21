import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_NAME = process.env.ADMIN_NAME

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({ 
            email: ADMIN_EMAIL.toLowerCase().trim(),
            role: 'admin' 
        });

        if (existingAdmin) {
            console.log('Admin user already exists with email:', ADMIN_EMAIL);
            
            const readline = await import('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('Do you want to update the admin password? (y/N): ', async (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                    
                    await User.findByIdAndUpdate(existingAdmin._id, {
                        password: hashedPassword
                    });
                    
                    console.log('Admin password updated successfully!');
                } else {
                    console.log('Admin user unchanged.');
                }
                
                rl.close();
                await mongoose.disconnect();
                process.exit(0);
            });
            
            return;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

        const adminUser = new User({
            email: ADMIN_EMAIL.toLowerCase().trim(),
            password: hashedPassword,
            name: ADMIN_NAME,
            role: 'admin',
            isFirebaseUser: false,
            firebaseUid: null,
            dateOfBirth: null,
            isMother: false,
            gender: null
        });

        await adminUser.save();

        console.log('Admin user created successfully!');
        console.log('Email:', ADMIN_EMAIL);
        console.log('Password:', ADMIN_PASSWORD);
    } catch (error) {
        console.error('Error creating admin user:', error.message);
        
        if (error.code === 11000) {
            console.log('User with this email already exists. Please check existing users.');
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

function validateCredentials() {
    if (!ADMIN_EMAIL || !ADMIN_EMAIL.includes('@')) {
        console.error('Invalid admin email. Please set ADMIN_EMAIL environment variable or modify the script.');
        process.exit(1);
    }

    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
        console.error('Admin password must be at least 8 characters long.');
        process.exit(1);
    }

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI environment variable is required.');
        process.exit(1);
    }
}

console.log('Creating Carina Admin User...\n');
validateCredentials();
createAdminUser();