import express from 'express';
import { googleLogin } from '../controllers/authController';
// import { validateRequest } from '../middlewares/validateRequest';
// import { registerSchema } from '../validators/authSchemas';
import { catchAsync } from '../utils/catchAsync';
const router = express.Router();

router.post('/google-login', catchAsync(googleLogin));

export default router;
