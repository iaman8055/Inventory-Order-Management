from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.models.order import Order

LOW_STOCK_THRESHOLD = 10


def get_dashboard_metrics(db: Session) -> dict:
    # 1. Fetch Counts
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # 2. Fetch Low Stock Data
    low_stock_products = (
        db.query(Product)
        .filter(Product.stock_quantity < LOW_STOCK_THRESHOLD)
        .all()
    )

    # 3. Fetch Financial Valuations
    inventory_value = (
        db.query(func.sum(Product.price * Product.stock_quantity)).scalar() or 0
    )
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0

    # 4. Construct Structured Response
    return {
        "summary": {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "low_stock_count": len(low_stock_products),
            "inventory_value": round(inventory_value, 2),
            "total_revenue": round(total_revenue, 2),
        },
        "low_stock_products": [
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "stock_quantity": product.stock_quantity,
                "price": product.price,
            }
            for product in low_stock_products
        ],
    }