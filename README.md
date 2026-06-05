# Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System built using FastAPI, React, PostgreSQL, Docker, and Docker Compose.

## Overview

This application helps businesses manage:

- Products
- Customers
- Orders
- Inventory Tracking

The system automatically manages stock levels, validates business rules, and provides a dashboard for monitoring inventory and orders.

---

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL

### Frontend

- React
- Vite
- Axios
- React Router

### Database

- PostgreSQL

### DevOps

- Docker
- Docker Compose
- Docker Hub

### Deployment

- Backend: Render
- Frontend: Vercel
- Database: PostgreSQL (Supabase / Render)

---

# Features

## Product Management

- Create Product
- View Products
- Update Product
- Delete Product

Product Fields:

- Name
- SKU
- Price
- Quantity in Stock

Business Rules:

- SKU must be unique
- Quantity cannot be negative

---

## Customer Management

- Create Customer
- View Customers
- View Customer Details
- Delete Customer

Customer Fields:

- Full Name
- Email
- Phone Number

Business Rules:

- Email must be unique

---

## Order Management

- Create Order
- View Orders
- View Order Details
- Delete Order

Order Features:

- Multiple products per order
- Automatic stock deduction
- Automatic total calculation

Business Rules:

- Cannot place orders if stock is insufficient
- Stock updates automatically after order creation

---

## Dashboard

Displays:

- Total Products
- Total Customers
- Total Orders
- Low Stock Products
- Inventory Value
- Total Revenue

---

# Project Structure

```text
inventory-order-management/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   └── App.jsx
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker-compose.yml
└── README.md
```

---

# API Endpoints

## Products

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | /products | Create Product |
| GET | /products | Get All Products |
| GET | /products/{id} | Get Product |
| PUT | /products/{id} | Update Product |
| DELETE | /products/{id} | Delete Product |

---

## Customers

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | /customers | Create Customer |
| GET | /customers | Get All Customers |
| GET | /customers/{id} | Get Customer |
| DELETE | /customers/{id} | Delete Customer |

---

## Orders

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | /orders | Create Order |
| GET | /orders | Get All Orders |
| GET | /orders/{id} | Get Order Details |
| DELETE | /orders/{id} | Delete Order |

---

## Dashboard

| Method | Endpoint |
|----------|----------|
| GET | /dashboard |

---

# Running Locally

## Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Docker Setup

Build and run all services:

```bash
docker compose up --build
```

Services:

- Frontend
- Backend
- PostgreSQL

Stop:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

---

# Environment Variables

## Backend

Create `.env`

```env
DATABASE_URL=postgresql://username:password@host:5432/database
```

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
```

---

## Frontend

Create `.env`

```env
VITE_API_URL=http://localhost:8000
```

Production:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

---

# Deployment

## Backend

Deployed on Render

Backend URL:

```text
https://your-backend.onrender.com
```

---

## Frontend

Deployed on Vercel

Frontend URL:

```text
https://your-frontend.vercel.app
```

---

# Docker Hub

Backend Image:

```text
https://hub.docker.com/r/YOUR_DOCKER_USERNAME/inventory-api
```

---

# Sample Order Request

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

---

# Business Logic Implemented

- Unique Product SKU
- Unique Customer Email
- Stock Validation
- Automatic Stock Deduction
- Automatic Total Calculation
- Request Validation
- Proper HTTP Status Codes
- Error Handling

---


