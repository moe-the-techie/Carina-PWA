import User from'../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';
import { auth, adminAuth } from '../config/firebase.js';
import {
	createUserWithEmailAndPassword,
	sendEmailVerification,
	signInWithEmailAndPassword,
	sendPasswordResetEmail
} from 'firebase/auth';

// TODO: consider adding logout endpoint if needed

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: '30d'});
};

export async function register(req, res) {
    try {
        let { email, password, name, dateOfBirth, isMother, gender } = req.body;
        email = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            if (existingUser.isBanned) {
                return res.status(403).json({ error: 'This email has been banned and cannot be used to register.' });
            }
            return res.status(400).json({ error: `The email ${email} is already registered. Try logging in!` });
        }

        const bannedUser = await User.findOne({ email: email, isBanned: true });
        if (bannedUser) {
            return res.status(403).json({ error: 'This email has been banned and cannot be used to register.' });
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);

        console.log('User registered:', userCredential.user.uid);

        const newUser = new User({
            firebaseUid: userCredential.user.uid,
            name: name,
            email: email,
            dateOfBirth: dateOfBirth,
            isMother: isMother,
            gender: gender
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully! Verification email sent.',
            user: {
                _id: newUser._id,
                firebaseUid: userCredential.user.uid,
                name: newUser.name,
                email: newUser.email,
                dateOfBirth: newUser.dateOfBirth,
                isMother: newUser.isMother,
                gender: newUser.gender,
                role: newUser.role
            },
            requiresEmailVerification: true
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                return res.status(409).json({ error: 'username or email already exists' });
            case 'auth/invalid-email':
                return res.status(400).json({ error: 'Invalid email address.' });
            case 'auth/weak-password':
                return res.status(400).json({ error: 'Password is too weak.' });
            case 'auth/missing-password':
                return res.status(400).json({ error: 'Password is required.' });
            default:
                return res.status(500).json({ error: 'Internal Server Error.' });
        }
    }
};

export async function login(req, res) {
    try {
        let { email, password } = req.body;
        email = email.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const adminUser = await User.findOne({ 
            email: email, 
            isFirebaseUser: false,
            role: 'admin' 
        }).select('+password');

        if (adminUser) {
            console.log('Admin login attempt for:', email);
            
            if (adminUser.isBanned) {
                return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
            }
            
            const isPasswordValid = await bcrypt.compare(password, adminUser.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials.' });
            }

            const token = generateToken(adminUser._id);

            console.log('Admin logged in successfully:', adminUser._id);

            return res.status(200).json({
                message: 'Admin login successful.',
                user: {
                    _id: adminUser._id,
                    firebaseUid: null,
                    name: adminUser.name,
                    email: adminUser.email,
                    dateOfBirth: adminUser.dateOfBirth,
                    isMother: adminUser.isMother,
                    gender: adminUser.gender,
                    role: adminUser.role,
                    profileImageUrl: adminUser.profileImageUrl
                },
                token: token,
                firebase_uid: null,
                email_verified: true,
                isLocalAuth: true
            });
        }

        // If not admin user, proceed with Firebase authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        console.log('User logged in:', userCredential.user.uid);

        if (!userCredential.user.emailVerified) {
            return res.status(403).json({ 
                error: 'Email not verified. Please verify your email before logging in.',
                email_verified: false,
                canResendVerification: true
            });
        }

        const user = await User.findOne({ firebaseUid: userCredential.user.uid });

        if (!user) {
            return res.status(404).json({
                error: 'User not found in our database. Please contact support.'
            });
        }

        if (user.isBanned) {
            return res.status(403).json({ error: 'Your account has been banned. Please contact support.' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: 'Login successful.',
            user: {
                _id: user._id,
                firebaseUid: user.firebaseUid,
                name: user.name,
                email: user.email,
                dateOfBirth: user.dateOfBirth,
                isMother: user.isMother,
                gender: user.gender,
                role: user.role,
                profileImageUrl: user.profileImageUrl
            },
            token: token,
            firebase_uid: userCredential.user.uid,
            email_verified: userCredential.user.emailVerified,
            isLocalAuth: false
        });

    } catch (error) {
        console.error('Error during login:', error);

    switch (error.code) {
        case 'auth/user-not-found':
            return res.status(404).json({ error: 'User with this email does not exist.' });
        case 'auth/invalid-credential':
            return res.status(401).json({ error: 'Invalid email or password.' });
        default:
            console.error('Unexpected login error:', error);
            return res.status(500).json({ error: 'Internal Server Error.' });
    }

    }
};

export async function validateToken(req, res) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = await verifyToken(token); // Use the function
        const user = await User.findById(decoded.userId);
        if(!user){
        return res.status(401).json({error: 'Invalid Token'})
        }
        res.status(200).json({ message: 'Token is valid', userId: decoded.userId , isAdmin: user.role === 'admin'});
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}


export async function resendVerificationWithAuth(req, res) {
    try {
        let { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;

        if (user && user.lastVerificationEmailSentAt) {
            const lastSentTime = user.lastVerificationEmailSentAt.getTime();
            if ((now - lastSentTime) < TWO_MINUTES) {
                const remainingSeconds = Math.ceil((TWO_MINUTES - (now - lastSentTime)) / 1000);
                return res.status(429).json({ 
                    error: `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
                    remainingSeconds
                });
            }
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (userCredential.user.emailVerified) {
                return res.status(400).json({ 
                    error: 'Email is already verified. Please try logging in again.',
                    emailVerified: true
                });
            }

            await sendEmailVerification(userCredential.user);
            
            await User.findOneAndUpdate(
                { email },
                { lastVerificationEmailSentAt: new Date(now) }
            );

            console.log('Verification email sent to:', email);

            res.status(200).json({ 
                message: 'Verification email sent successfully. Please check your email and verify before logging in.',
                success: true
            });

        } catch (authError) {
            console.error('Authentication error:', authError);
            
            // Handle authentication errors
            switch (authError.code) {
                case 'auth/user-not-found':
                    return res.status(404).json({ error: 'User with this email does not exist.' });
                case 'auth/invalid-email':
                    return res.status(400).json({ error: 'Invalid email address.' });
                case 'auth/invalid-credential':
                    return res.status(401).json({ error: 'Invalid credentials. Please check your email and password.' });
                case 'auth/too-many-requests':
                    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
                default:
                    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
            }
        }

    } catch (error) {
        console.error('Resend verification with auth error:', error);
        res.status(500).json({ error: error.message || 'Failed to resend verification email' });
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: trimmedEmail });
        
        if (!user) {
            return res.status(404).json({ error: 'User with this email does not exist.' });
        }

        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;

        if (user.lastPasswordResetEmailSentAt) {
            const lastSentTime = user.lastPasswordResetEmailSentAt.getTime();
            if ((now - lastSentTime) < TWO_MINUTES) {
                const remainingSeconds = Math.ceil((TWO_MINUTES - (now - lastSentTime)) / 1000);
                return res.status(429).json({ 
                    error: `Please wait ${remainingSeconds} seconds before requesting another password reset email.`,
                    remainingSeconds,
                    canResend: false
                });
            }
        }

        await sendPasswordResetEmail(auth, trimmedEmail);

        user.lastPasswordResetEmailSentAt = new Date(now);
        await user.save();

        console.log('Password reset email sent to:', trimmedEmail);
        res.status(200).json({ 
            message: 'Password reset email sent successfully. Please check your email.',
            success: true,
            canResend: false
        });
    } catch (error) {
        console.error('Error during password reset:', error);

        switch (error.code) {
            case 'auth/user-not-found':
                return res.status(404).json({ error: 'User with this email does not exist.' });
            case 'auth/invalid-email':
                return res.status(400).json({ error: 'Invalid email address.' });
            case 'auth/too-many-requests':
                return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
            default:
                return res.status(500).json({ error: 'Internal Server Error.' });
        }
    }
}

export async function canResendPasswordReset(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: trimmedEmail });
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;

        if (user && user.lastPasswordResetEmailSentAt) {
            const lastSentTime = user.lastPasswordResetEmailSentAt.getTime();
            if ((now - lastSentTime) < TWO_MINUTES) {
                const remainingSeconds = Math.ceil((TWO_MINUTES - (now - lastSentTime)) / 1000);
                return res.status(200).json({ 
                    canResend: false,
                    remainingSeconds,
                    message: `Please wait ${remainingSeconds} seconds before requesting another password reset email.`
                });
            }
        }

        res.status(200).json({ 
            canResend: true,
            remainingSeconds: 0,
            message: 'You can request a password reset email.'
        });
    } catch (error) {
        console.error('Error checking password reset status:', error);
        res.status(500).json({ error: 'Failed to check resend status.' });
    }
}
