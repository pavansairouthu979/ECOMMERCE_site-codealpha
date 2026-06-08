import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate Order Number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Create Order
export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod = 'CASH_ON_DELIVERY',
      notes = ''
    } = req.body;
    const userId = req.userId;

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Get user cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });
    }

    const taxAmount = subtotal * 0.18;
    const shippingCost = subtotal > 500 ? 0 : 50;
    const finalAmount = subtotal + taxAmount + shippingCost;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        totalAmount: subtotal,
        taxAmount,
        shippingCost,
        finalAmount,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        notes,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: { product: { select: { name: true, images: true } } }
        }
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { name: true, images: true, price: true } }
            }
          }
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true, price: true } }
          }
        },
        user: { select: { email: true, phone: true } }
      }
    });

    if (!order || order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized or order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

// Get Invoice
export const getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true, price: true } }
          }
        },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });

    if (!order || order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Generate invoice data (can be used to generate PDF)
    const invoice = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: order.user,
      shippingAddress: order.shippingAddress,
      items: order.items,
      totals: {
        subtotal: order.totalAmount,
        tax: order.taxAmount,
        shipping: order.shippingCost,
        total: order.finalAmount
      },
      status: order.status,
      paymentStatus: order.paymentStatus
    };

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice', error: error.message });
  }
};
