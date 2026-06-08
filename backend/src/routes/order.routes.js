import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  getInvoice
} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:orderId', getOrderDetails);
router.put('/:orderId/cancel', cancelOrder);
router.get('/:orderId/invoice', getInvoice);

export default router;
