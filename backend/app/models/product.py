from sqlalchemy import Column, Integer, String, Float
from app.database.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    sku = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    price = Column(Float, nullable=False)

    stock_quantity = Column(
        Integer,
        nullable=False,
        default=0
    )