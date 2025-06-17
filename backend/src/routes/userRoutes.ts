import express from 'express';
import { protect } from '../middlewares/authMiddleware';
import { getProfile } from '../controllers/userController';
import { sendMails, listMails } from '../controllers/emailController';
import { catchAsync } from '../utils/catchAsync';
import { formDataMiddleware } from '../middlewares/formDataMiddleware';

const router = express.Router();

router.get('/profile', protect, catchAsync(getProfile));
router.post('/sendMails', protect, formDataMiddleware, catchAsync(sendMails));
router.get('/listMails', protect, catchAsync(listMails));

export default router;
