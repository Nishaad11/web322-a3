// routes/task.routes.js
// This file MUST be a function that receives (app, Task, ensureLogin)

module.exports = function (app, Task, ensureLogin) {

  // ------------------------------
  // Dashboard
  // ------------------------------
  app.get('/dashboard', ensureLogin, async (req, res) => {
    try {
      const total = await Task.count({
        where: { userId: req.session.user.id }
      });

      const completed = await Task.count({
        where: { userId: req.session.user.id, status: 'completed' }
      });

      res.render('dashboard', {
        user: req.session.user,
        stats: { total, completed }
      });
    } catch (err) {
      res.status(500).render('error', {
        message: 'Dashboard error',
        user: req.session.user
      });
    }
  });

  // Protect all /tasks routes
  app.use('/tasks', ensureLogin);


  // ------------------------------
  // List all tasks
  // ------------------------------
  app.get('/tasks', async (req, res) => {
    try {
      const tasks = await Task.findAll({
        where: { userId: req.session.user.id },
        order: [['createdAt', 'DESC']]
      });

      res.render('tasks', {
        user: req.session.user,
        tasks
      });

    } catch (err) {
      res.status(500).render('error', {
        message: 'Failed to load tasks',
        user: req.session.user
      });
    }
  });


  // ------------------------------
  // Add task – show form
  // ------------------------------
  app.get('/tasks/add', (req, res) => {
    res.render('add-task', {
      user: req.session.user,
      error: null
    });
  });


  // ------------------------------
  // Add task – save
  // ------------------------------
  app.post('/tasks/add', async (req, res) => {
    try {
      const { title, description, dueDate, status } = req.body;

      if (!title?.trim()) {
        return res.render('add-task', {
          user: req.session.user,
          error: 'Title is required'
        });
      }

      let cleanedDueDate = null;
      if (dueDate?.trim()) {
        const d = new Date(dueDate);
        if (!isNaN(d)) cleanedDueDate = d;
      }

      await Task.create({
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: cleanedDueDate,
        status: status || 'pending',
        userId: req.session.user.id
      });

      res.redirect('/tasks');
    } catch (err) {
      res.render('add-task', {
        user: req.session.user,
        error: 'Failed to create task'
      });
    }
  });


  // ------------------------------
  // Edit task – show form
  // ------------------------------
  app.get('/tasks/edit/:id', async (req, res) => {
    try {
      const task = await Task.findOne({
        where: { id: req.params.id, userId: req.session.user.id }
      });

      if (!task) {
        return res.status(404).render('error', {
          message: 'Task not found',
          user: req.session.user
        });
      }

      res.render('edit-task', {
        user: req.session.user,
        task,
        error: null
      });

    } catch (err) {
      res.status(500).render('error', {
        message: 'Error loading task',
        user: req.session.user
      });
    }
  });


  // ------------------------------
  // Edit task – save changes
  // ------------------------------
  app.post('/tasks/edit/:id', async (req, res) => {
    try {
      const { title, description, dueDate, status } = req.body;

      if (!title?.trim()) {
        const task = await Task.findByPk(req.params.id);
        return res.render('edit-task', {
          user: req.session.user,
          task,
          error: 'Title is required'
        });
      }

      let cleanedDueDate = null;
      if (dueDate?.trim()) {
        const d = new Date(dueDate);
        if (!isNaN(d)) cleanedDueDate = d;
      }

      await Task.update(
        {
          title: title.trim(),
          description: description?.trim() || null,
          dueDate: cleanedDueDate,
          status: status || 'pending'
        },
        {
          where: {
            id: req.params.id,
            userId: req.session.user.id
          }
        }
      );

      res.redirect('/tasks');

    } catch (err) {
      console.error(err);
      const task = await Task.findByPk(req.params.id);

      res.render('edit-task', {
        user: req.session.user,
        task,
        error: 'Failed to update task'
      });
    }
  });


  // ------------------------------
  // Delete task
  // ------------------------------
  app.post('/tasks/delete/:id', async (req, res) => {
    await Task.destroy({
      where: {
        id: req.params.id,
        userId: req.session.user.id
      }
    });

    res.redirect('/tasks');
  });


  // ------------------------------
  // Toggle task status
  // ------------------------------
  app.post('/tasks/status/:id', async (req, res) => {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.session.user.id }
    });

    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await task.update({ status: newStatus });
    }

    res.redirect('/tasks');
  });

};
