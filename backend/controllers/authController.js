import User from'../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

// TODO: consider adding logout endpoint if needed

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: '30d'});
};

export async function register(req, res) {
    try {
        const { email, password, name, dateOfBirth, isMother, gender } = req.body;
        email = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(400).json({ error: `The email ${email} is already registered. Try logging in!` });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            dateOfBirth: dateOfBirth,
            isMother: isMother,
            gender: gender
        });

        await newUser.save();

        res.status(200).json({message: 'User created successfully!', user: newUser, token: generateToken(newUser._id)});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export async function login(req, res) {
    try {
        const { email } = req.body;
        email = email.trim().toLowerCase();

        const user = await User.findOne({ email : email });

        if (!user) {
            return res.status(404).json({error : `Email is not recognized. Please register first!`});
        }

        const correctPassword = await bcrypt.compare(req.body.password, user.password);

        if (!correctPassword) {
            return res.status(401).json({error: 'Password is incorrect. Please try again!'});
        }

        res.status(200).json({message: 'Login successful!', user: user, token: generateToken(user._id)});

    } catch (error) {
        res.status(500).json({error: error.message});
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
        res.status(200).json({ message: 'Token is valid', userId: decoded.userId });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
