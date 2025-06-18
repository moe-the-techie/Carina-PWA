import Form from '../models/Form.js';

export async function getAllForms (req, res) {
    // TODO: protect this route for admin only
    try {
        const forms = await Form.find();

        if (!forms || forms.length === 0) {
            return res.status(404).json({ error: '404: No forms found' });
        }

        res.status(200).json({ message: 'Forms fetched successfully', forms: forms});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getMyForms (req, res) {
    // TODO: make sure this defaults to the logged-in user except if an admin is logged in
    try {
        const userId = req.user._id;
        const forms = await Form.find({ user: userId });

        if (!forms || forms.length === 0) {
            return res.status(404).json({ error: 'No forms found for this user' });
        }

        res.status(200).json({ message: 'Forms fetched successfully', forms: forms});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserForms (req, res) {
    try {
        const userId = req.params.id;
        const forms = await Form.find({ user: userId });

        if (!forms || forms.length === 0) {
            return res.status(404).json({ error: `404: No forms found for user with ID ${userId}` });
        }

        res.status(200).json({ message: 'Forms fetched successfully', forms: forms});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function newForm(req, res) {
    try {
        const formData = { ...req.body, user: req.user._id };

        const newForm = new Form(formData);
        await newForm.save();

        res.status(201).json({ message: 'Form created successfully', form: newForm });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

