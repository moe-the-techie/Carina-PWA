import User from '../models/User.js';
import bcrypt from 'bcrypt';

// GET all users
export async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        if (!users){
            return res.status(404).json({error: '404: No users found'});
        }

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};

// Get user by ID
export async function getUserById(req, res) {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user){
            return res.status(404).json({error: `404: User with ID ${id} not found`});
        }

        res.status(200).json({user: user});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};

// GET user by Email (search)
export async function searchByEmail(req, res) {
    try {
        const email = req.params.email.toLowerCase().trim();

        if (!email) {
            return res.status(400).json({ error: '400: Email parameter is required' });
          }
        
        const regex = new RegExp(email, 'i'); // Case-insensitive regex

        const users = await User.find({ email: regex });

        if (users.length === 0) {
            return res.status(404).json({error: `404: No users with email ${email} found`});
        }

        res.status(200).json({users: users});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};

// GET user by name (search)
export async function searchByName(req, res) {
    try {
        const name = req.params.name;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: '400: Name parameter is required' });
        }
        
        const regex = new RegExp(name, 'i'); // Case-insensitive regex

        const users = await User.find({name: regex});

        if (!users || users.length === 0) {
            return res.status(404).json({error: `404: No users with name ${name} found`});
        }

        res.status(200).json({users: users});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};

// DELETE user by ID
export async function deleteUserById(req, res) {
    try {
        const id = req.params.id;

        if (!id || id.trim() === '') {
            return res.status(400).json({ error: '400: ID parameter is required' });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({error: `404: User with ID ${id} not found`});
        }

        res.status(200).json({message: `User with ID ${id} deleted successfully!`});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }
};

export async function updateUserById(req, res) {
    try {
        const changes = req.body;

        if (changes.password) {
            const salt = await bcrypt.genSalt(10);
            changes.password = await bcrypt.hash(changes.password, salt);
        }

        const user = await User.findByIdAndUpdate(req.params.id, changes, {new: true});

        if (!user) {
            return res.status(404).json({error: `404: User not found`});
        }

        res.status(200).json({message: `User with ID ${req.params.id} updated successfully!`, user: user});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}
