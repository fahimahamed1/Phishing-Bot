// index.js
const { app, hostURL } = require('./server/serverSetup');  // Importing the initialization
const PORT = process.env.PORT || 3000;

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at ${hostURL}`);
});