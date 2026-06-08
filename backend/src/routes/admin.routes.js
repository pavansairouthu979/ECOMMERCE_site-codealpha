import express from 'express';
import {
  getDashboardStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  getAdminOrders,
  updateOrderStatus,
  getSalesStats
} from '../controllers/admin.controller.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require auth and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);

// Users
router.get('/users', getAllUsers);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// Statistics
router.get('/sales-stats', getSalesStats);

export default router;
