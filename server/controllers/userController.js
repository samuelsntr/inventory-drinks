const { User } = require('../models');
const bcrypt = require('bcrypt');

// Ambil semua user (tanpa password) dalam urutan tanggal
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data user', error: err.message });
  }
};

// Tambah user baru
exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(409).json({ message: 'Username sudah dipakai' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'User berhasil dibuat', user: { id: newUser.id, username: newUser.username, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat user', error: err.message });
  }
};

// Edit username dan role (tidak ubah password)
exports.updateUser = async (req, res) => {
  try {
    const { username, role, password } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.username = username;
    user.role = role;

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({ message: 'User berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update user', error: err.message });
  }
};

// Hapus user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    await user.destroy();
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus user', error: err.message });
  }
};
