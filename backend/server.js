import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://carina-pwa-1.vercel.app/'], 
  credentials: true 
}));

// Use routes
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', profileRoutes);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
