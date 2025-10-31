// src/server.js
const app = require('./app');

const port = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 3000;

app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📘 Swagger: http://localhost:${port}/api-docs`);
});