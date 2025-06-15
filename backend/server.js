import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import formsRoutes from './routes/forms.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'https://carina-pwa-1.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Use routes
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', profileRoutes);
app.use('/api', formsRoutes);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
