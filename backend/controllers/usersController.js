import User from '../models/User.js';

export async function getAllUsers(req, res) {
    // TODO: protect this route for admins only
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

export async function getUserById(req, res) {
    // TODO: protect this route for admins only
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

export async function searchByEmail(req, res) {
    // TODO: protect this route for admins only
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

export async function searchByName(req, res) {
    // TODO: protect this route for admins only
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


export async function updateUserById(req, res) {
    try {
        let changes = req.body;

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
