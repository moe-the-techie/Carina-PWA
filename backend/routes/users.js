const express = require('express');
const router = require('express').Router();

const {
    getAllUsers,
    getUserById,
    searchByEmail
} = require('../controllers/usersController');

const { protect } = require('../middleware/auth');

router.get('/', protect, getAllUsers); // GET all users
router.get('/:id', protect, getUserById); // GET user by ID
router.get('/search/:email', protect, searchByEmail); // GET user by email (search)

module.exports = router;
