import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} from '../controllers/wishlist.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:wishlistItemId', removeFromWishlist);
router.post('/:wishlistItemId/move-to-cart', moveToCart);

export default router;
