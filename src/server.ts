import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { sanitizeInput } from './middleware/validation.middleware';
import { logger, stream } from './utils/logger';
import { apiRouter } from './routes';
import { AICostTrackerService } from './services/aiCostTracker.service';
import { intelligenceService } from './services/intelligence.service';
import { setupCronJobs } from './utils/cronJobs';
import cookieParser from 'cookie-parser';

// Create Express app
const app: Application = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream }));

// // Rate limiting
// const limiter = rateLimit({
//     windowMs: config.rateLimit.windowMs,
//     max: config.rateLimit.max,
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// // Apply rate limiting to all routes
// app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Sanitize input
app.use(sanitizeInput);

// API routes
app.use('/api', apiRouter);

// Health check route
app.get('/', (_, res) => {
    res.json({
        success: true,
        message: 'AI Cost Optimizer Backend API',
        version: '1.0.0',
        docs: '/api-docs',
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

export const startServer = async () => {
    try {
        await connectDatabase();
        logger.info('MongoDB connected');

        // Initialize AI Cost Tracker
        await AICostTrackerService.initialize();
        logger.info('AI Cost Tracker initialized');

        // Initialize default tips
        await intelligenceService.initializeDefaultTips();
        logger.info('Default tips initialized');

        // Setup Cron Jobs
        setupCronJobs();

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;