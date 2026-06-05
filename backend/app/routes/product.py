from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.product import ProductCreate, ProductUpdate

# Import our decoupled product service functions
from app.services.product import (
    create_new_product,
    get_all_products,
    get_product_by_id,
    update_existing_product,
    delete_product_by_id,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    try:
        return create_new_product(db, payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return get_all_products(db)


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    try:
        return get_product_by_id(db, product_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.put("/{product_id}")
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
):
    try:
        return update_existing_product(db, product_id, payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        delete_product_by_id(db, product_id)
        return {"message": "Product deleted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )