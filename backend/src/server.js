const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI at /api-docs
const spec = yaml.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: "Backend is alive!" });
});

const ticketsPath = path.join(__dirname, 'routes', 'tickets');
const ticketsRouter = require(ticketsPath);
app.use('/api/tickets', ticketsRouter);


const port = process.env.BACKEND_PORT || 3000;
app.listen(port, () => console.log(`🚀 Backend running on http://localhost:${port}`));
