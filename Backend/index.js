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


// --- CRUD KELAS ---

// GET All Kelas
app.get('/api/kelas', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kelas')
      .select('id_kelas, nama_kelas, id_guru, guru(nama_guru)')
      .order('id_kelas', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching kelas:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data kelas.' });
  }
});

// POST Create Kelas
app.post('/api/kelas', authenticateToken, async (req, res) => {
  const { nama_kelas, id_guru } = req.body;
  if (!nama_kelas) {
    return res.status(400).json({ message: 'Nama kelas wajib diisi' });
  }

  try {
    const { data, error } = await supabase
      .from('kelas')
      .insert([
        {
          nama_kelas: nama_kelas,
          id_guru: id_guru || null
        }
      ])
      .select('id_kelas, nama_kelas, id_guru, guru(nama_guru)')
      .single();

    // Handle Unique Constraint Violation (Error Code 23505)
    if (error) {
      if (error.code === '23505') {
         return res.status(400).json({ message: 'Nama kelas sudah terdaftar, silakan gunakan nama lain.' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Kelas berhasil ditambahkan', kelas: data });
  } catch (error) {
    console.error('Error creating kelas:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat kelas.' });
  }
});

// PUT Update Kelas
app.put('/api/kelas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama_kelas, id_guru } = req.body;
  
  if (!nama_kelas) {
    return res.status(400).json({ message: 'Nama kelas wajib diisi' });
  }

  try {
    const { data, error } = await supabase
      .from('kelas')
      .update({
        nama_kelas: nama_kelas,
        id_guru: id_guru || null
      })
      .eq('id_kelas', id)
      .select('id_kelas, nama_kelas, id_guru, guru(nama_guru)')
      .single();

    if (error) {
      if (error.code === '23505') {
         return res.status(400).json({ message: 'Nama kelas sudah terdaftar, silakan gunakan nama lain.' });
      }
      throw error;
    }

    res.json({ message: 'Data kelas berhasil diperbarui', kelas: data });
  } catch (error) {
    console.error('Error updating kelas:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui kelas.' });
  }
});

// DELETE Kelas
app.delete('/api/kelas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('kelas')
      .delete()
      .eq('id_kelas', id);

    if (error) throw error;
    res.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus kelas.' });
  }
});

// --- CRUD SISWA ---

// GET All Siswa
app.get('/api/siswa', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('siswa')
      .select('id_siswa, nim, nama_siswa, id_kelas, kelas(nama_kelas)')
      .order('id_siswa', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching siswa:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data siswa.' });
  }
});

// POST Create Siswa
app.post('/api/siswa', authenticateToken, async (req, res) => {
  const { nama_siswa, id_kelas } = req.body;
  if (!nama_siswa) {
    return res.status(400).json({ message: 'Nama siswa wajib diisi' });
  }

  try {
    // 1. Generate NIM (YY010XXX)
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Find highest id_siswa in DB
    const { data: maxIdData, error: countErr } = await supabase
      .from('siswa')
      .select('id_siswa')
      .order('id_siswa', { ascending: false })
      .limit(1);

    if (countErr) throw countErr;

    let nextSequence = 1;
    if (maxIdData && maxIdData.length > 0) {
      nextSequence = maxIdData[0].id_siswa + 1;
    }

    const nimString = `${currentYear}010${nextSequence.toString().padStart(3, '0')}`;
    
    // 2. Hash Password (Default = NIM)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nimString, salt);

    // 3. Insert to DB
    const { data, error } = await supabase
      .from('siswa')
      .insert([
        {
          nim: nimString,
          nama_siswa: nama_siswa,
          password: hashedPassword,
          id_kelas: id_kelas || null
        }
      ])
      .select('id_siswa, nim, nama_siswa, id_kelas, kelas(nama_kelas)')
      .single();

    if (error) {
      if (error.code === '23505') {
         return res.status(400).json({ message: 'NIM siswa sudah terdaftar, terjadi duplikasi.' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Akun siswa berhasil dibuat', siswa: data });
  } catch (error) {
    console.error('Error creating siswa:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat akun siswa.' });
  }
});

// PUT Update Siswa
app.put('/api/siswa/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama_siswa, id_kelas, password } = req.body;
  
  if (!nama_siswa) {
    return res.status(400).json({ message: 'Nama siswa wajib diisi' });
  }

  try {
    let updateData = {
      nama_siswa,
      id_kelas: id_kelas || null
    };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('siswa')
      .update(updateData)
      .eq('id_siswa', id)
      .select('id_siswa, nim, nama_siswa, id_kelas, kelas(nama_kelas)')
      .single();

    if (error) throw error;

    res.json({ message: 'Data siswa berhasil diperbarui', siswa: data });
  } catch (error) {
    console.error('Error updating siswa:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui akun siswa.' });
  }
});

// DELETE Siswa
app.delete('/api/siswa/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('siswa')
      .delete()
      .eq('id_siswa', id);

    if (error) throw error;
    res.json({ message: 'Akun siswa berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus akun siswa.' });
  }
});

// --- CRUD SESI SOAL ---

// GET All Sesi (Filtered for Guru)
app.get('/api/sesi', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('sesi')
      .select('*, kelas!inner(nama_kelas, id_guru)');

    // If user is a guru, only fetch their classes' sessions
    if (req.user.role === 'guru') {
      query = query.eq('kelas.id_guru', req.user.id);
    }

    const { data, error } = await query.order('tanggal_pembuatan', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching sesi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data sesi.' });
  }
});

// POST Create Sesi Utama
app.post('/api/sesi/utama', authenticateToken, async (req, res) => {
  const { id_kelas, tenggang_waktu } = req.body;
  
  if (!id_kelas || !tenggang_waktu) {
    return res.status(400).json({ message: 'Kelas dan tenggang waktu wajib diisi.' });
  }

  try {
    // 1. Get current date (only date part for tanggal_pembuatan)
    const tanggal_pembuatan = new Date().toISOString().split('T')[0];

    // 2. Calculate next session number for this specific class
    const { data: existingSesi, error: countErr } = await supabase
      .from('sesi')
      .select('sesi')
      .eq('id_kelas', id_kelas)
      .eq('tipe', 'Utama')
      .order('sesi', { ascending: false })
      .limit(1);

    if (countErr) throw countErr;

    let nextSesiNum = 1;
    if (existingSesi && existingSesi.length > 0) {
      nextSesiNum = Number(existingSesi[0].sesi) + 1;
    }

    // 3. Insert to DB
    const { data, error } = await supabase
      .from('sesi')
      .insert([
        {
          id_kelas,
          id_sesi_sebelum: null,
          sesi: nextSesiNum,
          tipe: 'Utama',
          tanggal_pembuatan,
          tenggang_waktu
        }
      ])
      .select('*, kelas(nama_kelas)')
      .single();

    if (error) throw error;

    // Auto-generate soal for all students in the class
    const { data: siswaData, error: siswaErr } = await supabase
      .from('siswa')
      .select('id_siswa')
      .eq('id_kelas', id_kelas);

    if (!siswaErr && siswaData && siswaData.length > 0) {
      const fixedOhms = [220, 330, 470, 680];
      const soalToInsert = [];

      siswaData.forEach(siswa => {
        fixedOhms.forEach(ohm => {
          const volt = Math.floor(Math.random() * 9) + 3; // Random 3 to 11
          const ampere = parseFloat((volt / ohm).toFixed(4));
          soalToInsert.push({
            id_sesi: data.id_sesi,
            id_siswa: siswa.id_siswa,
            ohm,
            volt,
            ampere
          });
        });
      });

      if (soalToInsert.length > 0) {
        await supabase.from('soal').insert(soalToInsert);
      }
    }

    res.status(201).json({ message: 'Sesi Utama berhasil dibuat', sesi: data });
  } catch (error) {
    console.error('Error creating sesi utama:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat sesi utama.' });
  }
});

// POST Create Sesi Remidi
app.post('/api/sesi/remidi', authenticateToken, async (req, res) => {
  const { id_kelas, id_sesi_sebelum, tenggang_waktu } = req.body;
  
  if (!id_kelas || !id_sesi_sebelum || !tenggang_waktu) {
    return res.status(400).json({ message: 'Kelas, Sesi Induk, dan tenggang waktu wajib diisi.' });
  }

  try {
    const tanggal_pembuatan = new Date().toISOString().split('T')[0];

    // Get the parent session's number
    const { data: parentSesi, error: parentErr } = await supabase
      .from('sesi')
      .select('sesi')
      .eq('id_sesi', id_sesi_sebelum)
      .single();

    if (parentErr) throw parentErr;

    const { data, error } = await supabase
      .from('sesi')
      .insert([
        {
          id_kelas,
          id_sesi_sebelum,
          sesi: parentSesi.sesi,
          tipe: 'Remidi',
          tanggal_pembuatan,
          tenggang_waktu
        }
      ])
      .select('*, kelas(nama_kelas)')
      .single();

    if (error) throw error;

    // Auto-generate soal for all students in the class
    const { data: siswaData, error: siswaErr } = await supabase
      .from('siswa')
      .select('id_siswa')
      .eq('id_kelas', id_kelas);

    if (!siswaErr && siswaData && siswaData.length > 0) {
      const fixedOhms = [220, 330, 470, 680];
      const soalToInsert = [];

      siswaData.forEach(siswa => {
        fixedOhms.forEach(ohm => {
          const volt = Math.floor(Math.random() * 9) + 3; // Random 3 to 11
          const ampere = parseFloat((volt / ohm).toFixed(4));
          soalToInsert.push({
            id_sesi: data.id_sesi,
            id_siswa: siswa.id_siswa,
            ohm,
            volt,
            ampere
          });
        });
      });

      if (soalToInsert.length > 0) {
        await supabase.from('soal').insert(soalToInsert);
      }
    }

    res.status(201).json({ message: 'Sesi Remidi berhasil dibuat', sesi: data });
  } catch (error) {
    console.error('Error creating sesi remidi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat sesi remidi.' });
  }
});

// PUT Edit Sesi (Tenggang Waktu)
app.put('/api/sesi/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tenggang_waktu } = req.body;
  
  if (!tenggang_waktu) {
    return res.status(400).json({ message: 'Tenggang waktu wajib diisi.' });
  }

  try {
    const { data, error } = await supabase
      .from('sesi')
      .update({ tenggang_waktu })
      .eq('id_sesi', id)
      .select('*, kelas(nama_kelas)')
      .single();

    if (error) throw error;

    res.json({ message: 'Tenggang waktu berhasil diperbarui', sesi: data });
  } catch (error) {
    console.error('Error updating sesi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui tenggang waktu.' });
  }
});

// DELETE Sesi
app.delete('/api/sesi/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('sesi')
      .delete()
      .eq('id_sesi', id);

    if (error) throw error;
    res.json({ message: 'Sesi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting sesi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus sesi.' });
  }
});

// --- KUIS SISWA ---

// GET Sesi Aktif Siswa
app.get('/api/kuis/aktif', authenticateToken, async (req, res) => {
  if (req.user.role !== 'siswa') {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }

  try {
    // Get the student's class
    const { data: siswaData, error: siswaErr } = await supabase
      .from('siswa')
      .select('id_kelas')
      .eq('id_siswa', req.user.id)
      .single();

    if (siswaErr || !siswaData?.id_kelas) {
      return res.json(null); // No class
    }

    // Find active session for this class (tenggang_waktu > now)
    const now = new Date().toISOString();
    const { data: sesiData, error: sesiErr } = await supabase
      .from('sesi')
      .select('*')
      .eq('id_kelas', siswaData.id_kelas)
      .gte('tenggang_waktu', now)
      .order('tenggang_waktu', { ascending: true }) // closest deadline first
      .limit(1)
      .single();

    if (sesiErr || !sesiData) {
      return res.json(null); // No active session
    }

    // Find the generated questions for this student and this session
    const { data: soalData, error: soalErr } = await supabase
      .from('soal')
      .select('*')
      .eq('id_sesi', sesiData.id_sesi)
      .eq('id_siswa', req.user.id)
      .order('id_soal', { ascending: true });

    if (soalErr) throw soalErr;

    res.json({
      sesi: sesiData,
      soal: soalData
    });
  } catch (error) {
    console.error('Error fetching kuis aktif:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil kuis aktif.' });
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
