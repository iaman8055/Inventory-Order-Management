from sqlalchemy.orm import Session, joinedload
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate


def create_new_order(db: Session, payload: OrderCreate) -> Order:
    # 1. Validate Customer
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise ValueError("Customer not found")

    total_amount = 0

    # 2. Initialize Order
    order = Order(customer_id=payload.customer_id, total_amount=0)
    db.add(order)
    db.flush()  # Generates order.id without committing

    # 3. Process Order Items and Manage Stock
    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise ValueError(f"Product {item.product_id} not found")

        if product.stock_quantity < item.quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

        subtotal = product.price * item.quantity
        total_amount += subtotal

        # Deduct stock
        product.stock_quantity -= item.quantity

        # Create OrderItem link
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
            subtotal=subtotal,
        )
        db.add(order_item)

    # 4. Save calculations and commit
    order.total_amount = total_amount
    db.commit()
    db.refresh(order)
    return order


def get_all_orders(db: Session):
    return db.query(Order).options(joinedload(Order.items)).all()


def get_order_by_id(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise ValueError("Order not found")
    return order


def delete_order_by_id(db: Session, order_id: int) -> bool:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise ValueError("Order not found")

    # Restore stock before deleting
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity

    db.delete(order)
    db.commit()
    return True