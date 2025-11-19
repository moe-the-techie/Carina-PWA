import express from 'express';
const router = express.Router();
import { getAllUsers, getUserById, searchByEmail, searchByName, updateUserById }  from '../controllers/usersController.js';
import { protect } from '../middleware/auth.js';

router.get('/users/', protect, getAllUsers); // GET all users
router.get('/users/id/:id', protect, getUserById); // GET user by ID
router.get('/users/email/:email', protect, searchByEmail); // GET user by email (search)
router.get('/users/name/:name', protect, searchByName); // GET user by name (search)
router.put('/users/:id', protect, updateUserById); // PUT user by ID

export default router;
