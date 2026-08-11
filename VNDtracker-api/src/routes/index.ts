import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';
import { CategoryController } from '../modules/category/category.controller';
import { ExpenseController } from '../modules/expense/expense.controller';
import { AiController } from '../modules/ai/ai.controller';
import { BudgetController } from '../modules/budget/budget.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { authLimiter, forgotPasswordLimiter, aiScanLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

const authController = new AuthController();
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.put('/auth/change-password', requireAuth, authController.changePassword);
router.post('/auth/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);

const categoryController = new CategoryController();
router.get('/categories', requireAuth, categoryController.getAll);
router.post('/categories', requireAuth, categoryController.create);
router.put('/categories/:id', requireAuth, categoryController.update);
router.delete('/categories/:id', requireAuth, categoryController.delete);

const expenseController = new ExpenseController();
router.get('/expenses', requireAuth, expenseController.getAll);
router.post('/expenses', requireAuth, expenseController.create);
router.put('/expenses/:id', requireAuth, expenseController.update);
router.delete('/expenses/:id', requireAuth, expenseController.delete);

const aiController = new AiController();
router.post('/ai/scan', requireAuth, aiScanLimiter, aiController.scan);

const budgetController = new BudgetController();
router.get('/budgets', requireAuth, budgetController.getAll);
router.put('/budgets', requireAuth, budgetController.upsert);
router.delete('/budgets/overall', requireAuth, budgetController.deleteOverall);
router.delete('/budgets/category/:categoryId', requireAuth, budgetController.deleteCategory);

export default router;
