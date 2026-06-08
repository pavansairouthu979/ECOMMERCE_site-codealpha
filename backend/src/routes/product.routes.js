import express from 'express';
import {
  getAllProducts,
  getProductDetails,
  getCategories,
  addReview,
  getProductReviews,
  searchProducts
} from '../controllers/product.controller.js';
import { optionalAuthMiddleware, authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, getAllProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/:id', optionalAuthMiddleware, getProductDetails);
router.post('/:id/reviews', authMiddleware, addReview);
router.get('/:id/reviews', getProductReviews);

export default router;
