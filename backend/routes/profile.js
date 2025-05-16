import express from 'express';;
const router = express.Router();
import { protect } from '../middleware/auth.js';

router.get('/profile', protect, async (req, res) => {
    return res.status(200).json({user: req.user});
});

export default router;
