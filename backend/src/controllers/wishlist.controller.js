import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                images: true,
                ratings: true,
                stock: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
};

// Add to Wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId }
      });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountPrice: true,
            images: true,
            slug: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Added to wishlist',
      wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Failed to add to wishlist', error: error.message });
  }
};

// Remove from Wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { wishlistItemId } = req.params;
    const userId = req.userId;

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: { wishlist: true }
    });

    if (!wishlistItem || wishlistItem.wishlist.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId }
    });

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Failed to remove from wishlist', error: error.message });
  }
};

// Move to Cart
export const moveToCart = async (req, res) => {
  try {
    const { wishlistItemId } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.userId;

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: { wishlist: true, product: true }
    });

    if (!wishlistItem || wishlistItem.wishlist.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check stock
    if (wishlistItem.product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }

    // Add to cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: wishlistItem.productId
      }
    });

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: wishlistItem.productId,
          quantity,
          price: wishlistItem.product.discountPrice || wishlistItem.product.price
        }
      });
    }

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId }
    });

    res.json({ message: 'Moved to cart successfully' });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ message: 'Failed to move to cart', error: error.message });
  }
};
