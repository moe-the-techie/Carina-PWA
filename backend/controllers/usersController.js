const User = require('../models/User');

// GET all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (!users){
            return res.status(404).json({error: '404: No users found'});
        }

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: error.message});
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user){
            return res.status(404).json({error: `404: User with ID ${id} not found`});
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: error.message});
    }
};

// GET user by Email (search)
const searchByEmail = async (req, res) => {
    try {
        const email = req.params.email;
        
        const regex = new RegExp(email, 'i'); // Case-insensitive regex

        const users = await User.find({ email: regex });

        if (!users || users.length === 0) {
            return res.status(404).json({error: `404: No users with email ${email} found`});
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: error.message});
    }
};


module.exports = {
    searchByEmail,
    getAllUsers,
    getUserById
};