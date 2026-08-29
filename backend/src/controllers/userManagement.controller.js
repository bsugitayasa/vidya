const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    const searchCondition = search ? {
      OR: [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const totalItems = await prisma.user.count({ where: searchCondition });

    const users = await prisma.user.findMany({
      where: searchCondition,
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      }
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, nama, role = 'ADMIN' } = req.body;

    if (!email || !password || !nama) {
      return res.status(400).json({ success: false, message: 'Email, password, dan nama wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!['ADMIN', 'BENDAHARA'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role user tidak valid' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        role,
      },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      message: `User ${role === 'BENDAHARA' ? 'Bendahara' : 'Admin'} "${nama}" berhasil didaftarkan`,
      data: user
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat user baru' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Prevent self-delete
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun Anda sendiri' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Prevent deleting SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Tidak dapat menghapus akun Super Admin' });
    }

    const financeReferences = await prisma.auditKeuangan.count({ where: { userId } });
    if (financeReferences > 0) {
      return res.status(409).json({
        success: false,
        message: 'User memiliki riwayat transaksi keuangan dan tidak dapat dihapus demi menjaga jejak audit.'
      });
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({
      success: true,
      message: `User "${user.nama}" berhasil dihapus`
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus user' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userId = parseInt(id);

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Prevent resetting SUPER_ADMIN password from UI
    if (user.role === 'SUPER_ADMIN' && userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak dapat mereset password Super Admin lain' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: `Password user "${user.nama}" berhasil direset`
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset password' });
  }
};

module.exports = {
  getUsers,
  createUser,
  deleteUser,
  resetPassword
};
