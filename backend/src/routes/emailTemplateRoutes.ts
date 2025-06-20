import express from 'express';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/emailTemplateController';
import { protect } from '../middlewares/authMiddleware';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.use(protect);

router.post('/add-template', catchAsync(createTemplate));
router.post('/list-templates', catchAsync(getTemplates));
router.post('/get-template', catchAsync(getTemplateById));
router.post('/update-template', catchAsync(updateTemplate));
router.post('/delete-template', catchAsync(deleteTemplate));

export default router;
