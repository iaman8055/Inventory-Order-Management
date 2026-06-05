from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.db import get_db
from backend.app.services.dashboard import get_dashboard_metrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Simply invoke the service and return the structured metric dictionary
    return get_dashboard_metrics(db)