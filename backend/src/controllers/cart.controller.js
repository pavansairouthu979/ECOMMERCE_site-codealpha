import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Cart
export const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await prisma.cart.findUnique({
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
                stock: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = cart.items.reduce((sum, item) => {
      const originalPrice = item.product.discountPrice ? item.product.price : item.price;
      const currentPrice = item.product.discountPrice || item.price;
      return sum + ((originalPrice - currentPrice) * item.quantity);
    }, 0);

    res.json({
      cart,
      totals: {
        subtotal,
        discount,
        tax: subtotal * 0.18,
        total: subtotal - discount + (subtotal * 0.18)
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
};

// Add to Cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.userId;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    // Check product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.stock < quantity) {
      return res.status(400).json({ message: 'Product not available or insufficient stock' });
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

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId
      }
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.discountPrice || product.price
        },
        include: { product: true }
      });
    }

    res.status(201).json({
      message: 'Added to cart successfully',
      cartItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
};

// Update Cart Item
export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: cartItem.productId }
    });

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true }
    });

    res.json({
      message: 'Cart item updated',
      cartItem: updatedItem
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
};

// Remove from Cart
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.userId;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true }
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Failed to remove from cart', error: error.message });
  }
};

// Clear Cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
};
