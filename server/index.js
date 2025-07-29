const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key';

// app.use(cors());
app.use(express.json());


let users = [];
let notes = [];
let otpStore = {};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, otp) => {
  console.log(`Sending OTP ${otp} to ${email}`);
  return true;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};


app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const otp = generateOTP();
    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, 
    };

    await sendOTP(email, otp);

    res.status(200).json({message : "otp sent" , otp})

  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});


app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const storedOTP = otpStore[email];
    if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);


    const user = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      provider: 'email',
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    delete otpStore[email];

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

  
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }


    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name || !googleId) {
      return res.status(400).json({ error: 'Google data required' });
    }

    let user = users.find(u => u.email === email);
    
    if (!user) {
      user = {
        id: uuidv4(),
        email,
        name,
        googleId,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Google login failed' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    },
  });
});


app.get('/api/notes', authenticateToken, (req, res) => {
  const userNotes = notes.filter(note => note.userId === req.user.id);
  res.json({ notes: userNotes });
});


app.post('/api/notes', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = {
      id: uuidv4(),
      userId: req.user.id,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.push(note);
    res.status(201).json({ message: 'Note created', note });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteId = req.params.id;
    const noteIndex = notes.findIndex(note => note.id === noteId && note.userId === req.user.id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes.splice(noteIndex, 1);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const noteIndex = notes.findIndex(note => note.id === noteId && note.userId === req.user.id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    res.json({ message: 'Note updated', note: notes[noteIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
