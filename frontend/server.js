const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - serve index.html for all non-static-file routes
app.get('*', (req, res) => {
  // If the request is for a file with an extension, and it doesn't exist, return 404
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    // Check if it's a static asset request
    const ext = path.extname(req.path);
    if (ext) {
      // For static assets, let express handle the 404
      return res.status(404).send('Not found');
    }
  }
  
  // For all other routes, serve index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});