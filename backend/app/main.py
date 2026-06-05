from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.db import Base, engine
from app.routes import customers, products, orders

from fastapi.exceptions import RequestValidationError


from backend.app.core.exceptions import (
    validation_exception_handler,
    generic_exception_handler
)
from backend.app.routes import dashboard, health


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory Management API",
    version="1.0.0",
    description="A clean, decoupled API for managing products, customers, and orders."
)

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

# 4. Register all the routers
app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(orders.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "status": "online", 
        "message": "Welcome to the Inventory Management API!"
    }