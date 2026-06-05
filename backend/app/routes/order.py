from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.order import OrderCreate

# Import the service functions
from app.services.order import (
    create_new_order,
    get_all_orders,
    get_order_by_id,
    delete_order_by_id,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    try:
        order = create_new_order(db, payload)
        return {
            "message": "Order created successfully",
            "order_id": order.id,
            "total_amount": order.total_amount,
        }
    except ValueError as e:
        # Translate business exceptions to proper HTTP responses
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    return get_all_orders(db)


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    try:
        return get_order_by_id(db, order_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        delete_order_by_id(db, order_id)
        return {"message": "Order deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )