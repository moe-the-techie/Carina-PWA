import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Use routes
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', profileRoutes);

// Serve static files from the React app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
