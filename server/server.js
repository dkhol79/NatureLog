const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const journalRoutes = require('./routes/journal');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Load or initialize in-memory storage from file
let users = [];
let journals = [];
const loadData = () => {
  try {
    if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
    if (fs.existsSync('journals.json')) journals = JSON.parse(fs.readFileSync('journals.json'));
  } catch (err) {
    console.error('Error loading data:', err);
  }
};
const saveData = () => {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('journals.json', JSON.stringify(journals, null, 2));
};
loadData();

app.use('/api/auth', authRoutes(users, saveData));
app.use('/api/journal', journalRoutes(journals, users, saveData));

app.listen(5000, () => console.log('Server running on port 5000'));