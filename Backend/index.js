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

// Middleware Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token, otorisasi ditolak!' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid!' });
  }
};

// REST API - Validate Token Endpoint (Me)
app.get('/api/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// --- CRUD GURU ---

// GET All Guru
app.get('/api/guru', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('guru')
      .select('id_guru, nip, nama_guru, is_active')
      .order('id_guru', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching guru:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data guru.' });
  }
});

// POST Create Guru
app.post('/api/guru', authenticateToken, async (req, res) => {
  const { nama_guru } = req.body;
  if (!nama_guru) {
    return res.status(400).json({ message: 'Nama guru wajib diisi' });
  }

  try {
    // 1. Generate NIP (YY020XXX)
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Find highest NIP in DB for the current year
    const { data: maxNipData, error: countErr } = await supabase
      .from('guru')
      .select('nip')
      .like('nip', `${currentYear}020%`)
      .order('nip', { ascending: false })
      .limit(1);

    if (countErr) throw countErr;

    let nextSequence = 1;
    if (maxNipData && maxNipData.length > 0) {
      const lastNip = maxNipData[0].nip;
      const lastSequence = parseInt(lastNip.slice(-3), 10);
      nextSequence = lastSequence + 1;
    }

    const nipString = `${currentYear}020${nextSequence.toString().padStart(3, '0')}`;
    
    // 2. Hash Password (Default = NIP)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nipString, salt);

    // 3. Insert to DB
    const { data, error } = await supabase
      .from('guru')
      .insert([
        {
          nip: nipString,
          nama_guru: nama_guru,
          password: hashedPassword,
          is_active: false
        }
      ])
      .select('id_guru, nip, nama_guru, is_active')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Akun guru berhasil dibuat', guru: data });
  } catch (error) {
    console.error('Error creating guru:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat akun guru.' });
  }
});

// PUT Update Guru
app.put('/api/guru/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama_guru, is_active, password } = req.body;
  
  if (!nama_guru) {
    return res.status(400).json({ message: 'Nama guru wajib diisi' });
  }

  try {
    let updateData = {
      nama_guru,
      is_active
    };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('guru')
      .update(updateData)
      .eq('id_guru', id)
      .select('id_guru, nip, nama_guru, is_active')
      .single();

    if (error) throw error;

    res.json({ message: 'Data guru berhasil diperbarui', guru: data });
  } catch (error) {
    console.error('Error updating guru:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui akun guru.' });
  }
});

// DELETE Guru
app.delete('/api/guru/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('guru')
      .delete()
      .eq('id_guru', id);

    if (error) throw error;
    res.json({ message: 'Akun guru berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting guru:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus akun guru.' });
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

// Trigger Railway Deploy 1

app.get('/api/testdeploy', (req, res) => res.send('Deploy success 2!'));

// Push Ulang 3
