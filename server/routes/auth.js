const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

module.exports = (users, saveData) => {
  router.post('/register', (req, res) => {
    const { email, password, username } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const user = { email, password, username, id: users.length + 1 };
    users.push(user);
    saveData(); // Persist to file
    const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '1h' }); // Added expiration
    res.json({ token });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  });

  return router;
};