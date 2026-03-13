import express from 'express';
import dotenv from 'dotenv';
import './bot'; // Import bot to start it
import './cron'; // Import cron jobs

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT as string) || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
