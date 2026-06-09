// Smart Learning OHM - Backend REST API Service
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforhukumohmproject';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helper function to compare passwords (supports plain text and bcrypt hash)
async function verifyPassword(inputPassword, dbPassword) {
  if (inputPassword === dbPassword) {
    return true;
  }
  try {
    return await bcrypt.compare(inputPassword, dbPassword);
  } catch (err) {
    return false;
  }
}

// REST API - Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username/NIP/NIM dan password harus diisi!' });
  }

  try {
    let userData = null;
    let userRole = '';
    let userId = null;
    let displayName = '';
    let identifier = '';

    // Determine login type: Admin (contains @ in email), Guru, or Siswa
    if (username.includes('@')) {
      // 1. Check Admin Table
      // Try 'umail' as requested in user schema
      let { data: adminData, error: adminErr } = await supabase
        .from('admin')
        .select('*')
        .eq('umail', username)
        .maybeSingle();

      // Fallback to 'email' in case the column is named email in the DB
      if (adminErr || !adminData) {
        const { data: adminEmailData } = await supabase
          .from('admin')
          .select('*')
          .eq('email', username)
          .maybeSingle();
        if (adminEmailData) {
          adminData = adminEmailData;
        }
      }

      if (adminData) {
        userData = adminData;
        userRole = 'admin';
        userId = adminData.id_admin;
        displayName = 'Admin';
        identifier = adminData.umail || adminData.email;
      }
    } else {
      // 2. Check Guru Table (via NIP)
      let { data: guruData } = await supabase
        .from('guru')
        .select('*')
        .eq('nip', username)
        .maybeSingle();

      if (guruData) {
        userData = guruData;
        userRole = 'guru';
        userId = guruData.id_guru;
        displayName = guruData.nama_guru;
        identifier = guruData.nip;
      } else {
        // 3. Check Siswa Table (via NIM)
        let { data: siswaData } = await supabase
          .from('siswa')
          .select('*')
          .eq('nim', username)
          .maybeSingle();

        if (siswaData) {
          userData = siswaData;
          userRole = 'siswa';
          userId = siswaData.id_siswa;
          displayName = siswaData.nama_siswa;
          identifier = siswaData.nim;
        }
      }
    }

    // If no user found in any table
    if (!userData) {
      return res.status(400).json({ 
        message: username.includes('@') 
          ? 'Email Admin tidak terdaftar!' 
          : 'NIP Guru atau NIM Siswa tidak terdaftar!' 
      });
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(password, userData.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password salah!' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: userId,
        role: userRole,
        username: identifier,
        name: displayName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Respond with user details and token
    return res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: userId,
        role: userRole,
        username: identifier,
        name: displayName
      }
    });

  } catch (error) {
    console.error('Error during login process:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server!', error: error.message });
  }
});

// REST API - Validate Token Endpoint (Me)
app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token, otorisasi ditolak!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid!' });
  }
});

// Root check endpoint
app.get('/', (req, res) => {
  res.send('Backend API Smart Learning OHM is running.');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
