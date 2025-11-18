Unit Tests
==========

This test file checks the small helper functions in our code that don’t depend on Express or Prisma.  
It only tests pure logic — things like comparing ticket objects, building the query filters, or creating ticket data.

File:
------
ticket.units.test.js

What it tests:
--------------
- toInt() → converts strings to numbers with a default
- diffTicket() → finds changes between two tickets
- buildTicketsWhere() → builds the Prisma "where" filter
- buildCreateTicketData() → builds the data object for creating a ticket
- buildTicketPatch() → builds a valid patch object for updates

How to run it:
--------------
From the project root, run:

    npx jest src/__tests__/ticket.units.test.js

or if you have a "test" script in package.json, you can do:

    npm test -- ticket.units.test.js

Notes:
------
- These tests do NOT start the Express server.
- They do NOT use Prisma or a database.
- They should run very fast.
