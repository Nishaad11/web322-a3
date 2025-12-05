/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Nishaad Student ID: 109348243 Date: 2025/12/03
********************************************************************************/

require('dotenv').config();
require('pg');

const express = require('express');
const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const clientSessions = require('client-sessions');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set("trust proxy", 1);

app.use(clientSessions({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL error:', err));

const User = require('./models/user.model');
const Task = require('./models/task.model')(sequelize);

sequelize.sync();

const ensureLogin = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.redirect('/login');
};

app.get('/', (req, res) => {
  res.render('home', { user: req.session?.user || null });
});

require('./routes/auth.routes')(app, User);
require('./routes/task.routes')(app, Task, ensureLogin);

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/login');
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).render('error', {
    message: err.message || 'Something went wrong!',
    user: req.session?.user || null
  });
});

app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page Not Found',
    user: req.session?.user || null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;
