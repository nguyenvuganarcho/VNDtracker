import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';

const router = Router();

const authController = new AuthController();
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Feature routes (category, expense) mount here as each is implemented

export default router;
