import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { finalAmount: true }
      })
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        items: true
      }
    });

    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { totalReviews: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        totalReviews: true,
        ratings: true
      }
    });

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.finalAmount || 0
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

// Get All Products (Admin)
export const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const skip = (page - 1) * limit;

    const filters = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } }
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
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// Create Product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      sku,
      slug,
      categoryId,
      images = []
    } = req.body;

    if (!name || !description || !price || !stock || !categoryId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        sku,
        slug,
        categoryId,
        images,
        isActive: true
      },
      include: { category: { select: { name: true } } }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      sku,
      slug,
      categoryId,
      images,
      isActive
    } = req.body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(discountPrice !== undefined && { discountPrice: discountPrice ? parseFloat(discountPrice) : null }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(sku && { sku }),
        ...(slug && { slug }),
        ...(categoryId && { categoryId }),
        ...(images && { images }),
        ...(isActive !== undefined && { isActive })
      },
      include: { category: { select: { name: true } } }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const skip = (page - 1) * limit;

    const filters = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where: filters })
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get All Orders (Admin)
export const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', paymentStatus = '' } = req.query;

    const skip = (page - 1) * limit;

    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { quantity: true } }
        }
      }),
      prisma.order.count({ where: filters })
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
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus })
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true
      }
    });

    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Get Sales Statistics
export const getSalesStats = async (req, res) => {
  try {
    const { period = '7days' } = req.query;

    let daysBack = 7;
    if (period === '30days') daysBack = 30;
    if (period === '90days') daysBack = 90;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate }
      },
      select: {
        finalAmount: true,
        status: true,
        createdAt: true,
        items: { select: { quantity: true } }
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

    res.json({
      period,
      statistics: {
        totalOrders,
        totalRevenue,
        totalItems,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      orders
    });
  } catch (error) {
    console.error('Sales stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};
