from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.customer import CustomerCreate

# Updated imports to include the new service functions
from app.services.customer import (
    create_new_customer, 
    get_all_customers,
    get_customer_by_id,
    delete_customer_by_id
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    try:
        return create_new_customer(db, payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    return get_all_customers(db)


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    try:
        return get_customer_by_id(db, customer_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    try:
        delete_customer_by_id(db, customer_id)
        return {"message": "Customer deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )