const { exec } = require('child_process');

// Simple test to check if we can connect to MongoDB and find the tailor
exec('mongosh "mongodb://localhost:27017/fashion_connect_db" --eval "db.users.findOne({email: \'kentailor10@gmail.com\', role: \'TAILOR\'}, {name: 1, email: 1, profileImage: 1})"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`MongoDB Output: ${stdout}`);
});