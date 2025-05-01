import express from 'express';;
const router = express.Router();
import protect from '../middleware/auth.js';

// TODO: add logic for user profile updating using put

router.get('/', protect, async (req, res) => {
    return res.status(200).json({user: req.user});
});

export default router;
