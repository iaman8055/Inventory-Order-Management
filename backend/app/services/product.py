from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def create_new_product(db: Session, payload: ProductCreate) -> Product:
    # Check for unique SKU constraint
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise ValueError("SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_all_products(db: Session):
    return db.query(Product).all()


def get_product_by_id(db: Session, product_id: int) -> Product:
    # Note: Using .filter().first() as .get() is legacy/deprecated in newer SQLAlchemy 2.x styles,
    # but keeping your functionality consistent.
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")
    return product


def update_existing_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")

    # Update only the attributes provided in the payload
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product_by_id(db: Session, product_id: int) -> bool:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")

    db.delete(product)
    db.commit()
    return True