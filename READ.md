Inventory & Billing Management System (Backend)

This is a backend I made for managing products, customers, vendors, and transactions for a small business.
It’s built with Node.js, Express, and MongoDB. Authentication is done with JWT and passwords are hashed using bcryptjs.

Features

1. Register/Login user

2. Add, update, delete, and search products

3. Manage customers and vendors

4. Record sales and purchases (stock updates automatically)

5. Simple reports for inventory and transactions

Setup
1. Clone and install
git clone <repo-link>
cd inventory-billing-backend
npm install

2. Create .env
MONGODB_URI=mongodb://localhost:27017/inventory_billing
JWT_SECRET=secret123
PORT=3000

3. Seed database
npm run seed


This will create:

User: Himanshu@gmail.com
Password:123456

10 products

Some customers and vendors

Few sample transactions

4. Start server
npm run dev   # development


Server runs at: http://localhost:8000

API Endpoints

1. Auth

POST /api/auth/register

POST /api/auth/login

2. Products

GET /api/products

POST /api/products

PUT /api/products/:

DELETE /api/products/:

3. Contacts

GET /api/contacts

POST /api/contacts

PUT /api/contacts/:id

DELETE /api/contacts/:id

4. Transactions

GET /api/transactions

POST /api/transactions

5. Reports

GET /api/reports/inventory

GET /api/reports/transactions