// Import routes
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const assessmentsRoutes = require('./routes/assessments');
const claimsRoutes = require('./routes/claims');
const paymentsRoutes = require('./routes/payments');
const marketplaceRoutes = require('./routes/marketplace');

// Register routes
app.use('/api/:version/auth', authRoutes);
app.use('/api/:version/projects', projectsRoutes);
app.use('/api/:version/assessments', assessmentsRoutes);
app.use('/api/:version/claims', claimsRoutes);
app.use('/api/:version/payments', paymentsRoutes);
app.use('/api/:version/marketplace', marketplaceRoutes);

// Catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});
