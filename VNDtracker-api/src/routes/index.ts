import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';
import { CategoryController } from '../modules/category/category.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const authController = new AuthController();
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

const categoryController = new CategoryController();
router.get('/categories', requireAuth, categoryController.getAll);
router.post('/categories', requireAuth, categoryController.create);
router.put('/categories/:id', requireAuth, categoryController.update);
router.delete('/categories/:id', requireAuth, categoryController.delete);

// Feature routes (expense) mount here as each is implemented

export default router;
