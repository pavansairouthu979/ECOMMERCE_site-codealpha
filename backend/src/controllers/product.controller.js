import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get All Products with Filters
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      categoryId = '',
      minPrice = 0,
      maxPrice = 999999,
      sortBy = 'newest',
      rating = 0
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filters = {
      isActive: true,
      price: {
        gte: parseFloat(minPrice),
        lte: parseFloat(maxPrice)
      }
    };

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (parseFloat(rating) > 0) {
      filters.ratings = { gte: parseFloat(rating) };
    }

    // Build sort
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price-low') orderBy = { price: 'asc' };
    if (sortBy === 'price-high') orderBy = { price: 'desc' };
    if (sortBy === 'rating') orderBy = { ratings: 'desc' };
    if (sortBy === 'popular') orderBy = { totalReviews: 'desc' };

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy,
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          images: true,
          ratings: true,
          totalReviews: true,
          category: { select: { name: true } },
          stock: true,
          slug: true
        }
      }),
      prisma.product.count({ where: filters })
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// Get Single Product Details
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            user: { select: { firstName: true, lastName: true, avatar: true } },
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        isActive: true
      },
      take: 4,
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        images: true,
        ratings: true,
        slug: true
      }
    });

    res.json({
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

// Get All Categories
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        image: true,
        slug: true,
        _count: { select: { products: true } }
      }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

// Add Product Review
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: id,
        userId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You already reviewed this product' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || '',
        productId: id,
        userId
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } }
      }
    });

    // Update product rating
    const reviews = await prisma.review.findMany({
      where: { productId: id }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id },
      data: {
        ratings: avgRating,
        totalReviews: reviews.length
      }
    });

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
};

// Get Product Reviews
export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } }
        }
      }),
      prisma.review.count({ where: { productId: id } })
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// Search Products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          { isActive: true }
        ]
      },
      take: 8,
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true,
        images: true,
        slug: true
      }
    });

    res.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};
