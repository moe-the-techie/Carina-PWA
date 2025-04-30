// TODO: user router to fetch user's own data
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
    return res.status(200).json({user: req.user});
});

module.exports = router;
