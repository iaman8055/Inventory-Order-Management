from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.database.db import Base, engine
from app.core.exceptions import (
    validation_exception_handler,
    generic_exception_handler
)
from app.routes import health, dashboard, customer, product, order

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Management API",
    version="1.0.0",
    description="A clean, decoupled API for managing products, customers, and orders.",
    redirect_slashes=False
)

# Exception Handlers Registration
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(customer.router)
app.include_router(product.router)
app.include_router(order.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "status": "online", 
        "message": "Welcome to the Inventory Management API!"
    }