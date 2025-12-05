
const User = require('../models/user.model');

module.exports = function (app) {
  app.get('/register', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    res.render('register', { user: null, error: null });
  });

  app.get('/login', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    res.render('login', { user: null, error: null });
  });

  app.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.render('register', { user: null, error: 'All fields are required' });
      }

      const existing = await User.findOne({
        $or: [{ username }, { email }]
      });
      if (existing) {
        return res.render('register', { user: null, error: 'Username or email already taken' });
      }

      const user = new User({ username, email, password });
      await user.save();

      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.render('register', { user: null, error: 'Registration failed' });
    }
  });

  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user || !(await user.comparePassword(password))) {
        return res.render('login', { user: null, error: 'Invalid username or password' });
      }

      req.session.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      };

      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.render('login', { user: null, error: 'Login failed' });
    }
  });
};