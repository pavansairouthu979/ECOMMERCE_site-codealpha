import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:cartItemId', updateCartItem);
router.delete('/items/:cartItemId', removeFromCart);
router.delete('/', clearCart);

export default router;
