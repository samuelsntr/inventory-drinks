const { User } = require('../models');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Password salah' });

    // Jika pakai session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({ message: 'Login berhasil', user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
  }
};

exports.me = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Belum login' });
  }

  res.json(req.session.user);
};


exports.register = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(409).json({ message: 'User sudah ada' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'Register berhasil', user: newUser });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    if (!users) return res.status(404).json({ message: 'Tidak ada user' });

    res.json({ message: 'Daftar user', users });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
  }
};

// controllers/AuthController.js
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Gagal logout:", err);
      return res.status(500).json({ message: "Gagal logout" });
    }

    // Hapus cookie di browser juga
    res.clearCookie("connect.sid"); // nama cookie default dari express-session
    res.json({ message: "Logout berhasil" });
  });
};

