import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startPlanReminderService } from './services/planReminderService.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import formsRoutes from './routes/forms.js';
import adminRoutes from './routes/admin.js';
import planRoutes from './routes/plan.js';
import templateRoutes from './routes/templates.js';
import chatRoutes from './routes/chat.js';
import announcementRoutes from './routes/announcements.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();
connectDB();

const app = express();

// Trust proxy for rate limiting behind reverse proxies (Vercel, nginx, etc.)
app.set('trust proxy', 1);

// Enable gzip compression for all responses - reduces bandwidth significantly
app.use(compression({
    level: 6, // Balance between compression ratio and CPU usage
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Body parsing with size limits to prevent abuse
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

const allowedOrigins = isDevelopment ? [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  //for philo's enviroment
  /^https:\/\/.*\.app\.github\.dev$/,
  /^https:\/\/.*\.github\.dev$/,
  'https://carina-pwa-1.vercel.app'
] : [
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
  origin:true,
  credentials: true
}));


// Use routes
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', profileRoutes);
app.use('/api', formsRoutes);
app.use('/api', adminRoutes);
app.use('/api', planRoutes);
app.use('/api', templateRoutes);
app.use('/api', chatRoutes);
app.use('/api', announcementRoutes);
app.use('/api', paymentRoutes);

// Debug logging route
app.post('/api/debug-log', (req, res) => {
  const { message, timestamp } = req.body;
  const logMessage = `[${new Date(timestamp).toISOString()}] ${message}\n`;
  
  fs.appendFile(path.join(__dirname, 'debug_log.txt'), logMessage, (err) => {
    if (err) {
      console.error('Error writing to debug log:', err);
      return res.status(500).json({ error: 'Failed to write log' });
    }
    res.status(200).json({ success: true });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start plan reminder and status update service
  startPlanReminderService();
});
