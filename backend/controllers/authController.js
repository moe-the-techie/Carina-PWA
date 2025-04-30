const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: '30d'});
};

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            res.status(400).json({ error: 'Please add all fields' });
        }

        // Check if user already exists
        const existingUser = await User.find({ email: email });

        if (existingUser) {
            return res.status(400).json({ message: `User with the email ${email} already exists` });
        }
        // TODO: encrypt password, generate token, and save useer to db

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please add all fields' });
        }

        const user = await User.findOne({ email : req.body.email });

        if (!user) {
            return res.status(404).json({error : `404: No user found with the email ${email}.`});
        }

        const correctPassword = await bcrypt.compare(req.body.password, user.password);

        if (!correctPassword) {
            return res.status(401).json({error: 'Incorrect password!'});
        }

        res.status(200).json({message: 'Login successful!', user: user, token: generateToken(user._id)});

    } catch (error) {
        res.status(500).json(error);
    }
};

module.exports = {
    register,
    login
};
