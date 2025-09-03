const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: "Backend is alive!" });
});

// Example route
app.get('/api/hello', (_req, res) => {
  res.json({ message: "Hello from Express backend 🎉" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Backend running on http://localhost:${port}`));
