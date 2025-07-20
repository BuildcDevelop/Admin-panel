import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin API running' });
});

// Admin routes
app.get('/api/admin/worlds', (req, res) => {
  res.json({ worlds: [] });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
});