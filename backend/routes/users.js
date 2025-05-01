import express from 'express';
const router = express.Router();
import { getAllUsers, getUserById, searchByEmail, searchByName }  from '../controllers/usersController.js';
import protect from '../middleware/auth.js';

router.get('/', protect, getAllUsers); // GET all users
router.get('/id/:id', protect, getUserById); // GET user by ID
router.get('/email/:email', protect, searchByEmail); // GET user by email (search)
router.get('/name/:name', protect, searchByName); // GET user by name (search)

export default router;
