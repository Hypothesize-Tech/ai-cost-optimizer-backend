import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import usageRouter from './usage.routes';
import optimizationRouter from './optimization.routes';
import analyticsRouter from './analytics.routes';
import eventRouter from './events.routes';
import { trackerRouter } from './tracker.routes';

const router = Router();

// Health check
router.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
});

// API version
router.get('/version', (_, res) => {
    res.status(200).json({ version: process.env.npm_package_version });
});

// Mount routes
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/usage', usageRouter);
router.use('/optimizations', optimizationRouter);
router.use('/analytics', analyticsRouter);
router.use('/events', eventRouter);
router.use('/tracker', trackerRouter);

export const apiRouter = router;