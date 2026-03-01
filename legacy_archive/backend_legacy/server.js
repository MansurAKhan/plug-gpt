import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRoutes } from './routes/chat.js';
import { toolRoutes } from './routes/tools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/tools', toolRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
