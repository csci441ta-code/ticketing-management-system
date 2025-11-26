Integration Tests
=================

These test files hit our actual Express routes using supertest.  
They verify that the API endpoints respond correctly and integrate properly with middleware and mocked Prisma.

Files:
------
health.test.js
tickets.test.js

What they test:
---------------
- health.test.js → Checks that GET /api/health returns { ok: true, message: 'Backend is alive!' }
- tickets.test.js → Tests routes under /api/tickets, like creating a ticket and listing tickets

How to run them:
----------------
From the project root, run either file individually:

    npx jest src/__tests__/health.test.js
    npx jest src/__tests__/tickets.test.js

Or run both integration tests together:

    npx jest src/__tests__/health.test.js src/__tests__/tickets.test.js

If you prefer npm syntax:

    npm test -- health.test.js
    npm test -- tickets.test.js

Notes:
------
- These tests use supertest to simulate HTTP requests.
- Prisma is mocked, so no real database is needed.
- They test the “real” API routes (Express + middleware), so they’re considered integration tests.
- If a test fails, Jest will show which endpoint or mock call caused it.
