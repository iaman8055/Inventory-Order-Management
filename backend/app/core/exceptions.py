from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    error_messages = []
    
    # Loop through Pydantic's default errors to make them clean and human-readable
    for error in exc.errors():
        field_name = error.get("loc")[-1] if error.get("loc") else "Field"
        error_type = error.get("type")
        
        if error_type == "missing":
            error_messages.append(f"The '{field_name}' field is required.")
        elif error_type.startswith("type_error"):
            error_messages.append(f"The value provided for '{field_name}' is invalid.")
        else:
            error_messages.append(f"Error in '{field_name}': {error.get('msg')}.")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,  # 400 is cleaner for users than 422
        content={
            "success": False,
            "message": "Validation Error",
            "errors": error_messages
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    user_friendly_message = "An unexpected error occurred."
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    if isinstance(exc, IntegrityError):
        status_code = status.HTTP_400_BAD_REQUEST
        error_details = str(exc.orig).lower()
        
        if "foreign key" in error_details and "violates" in error_details:
            user_friendly_message = (
                "Cannot delete this customer because they have active orders associated with them. "
                "Please clear or reassign their orders first."
            )

    # 1. Create the response object
    response = JSONResponse(
        status_code=status_code,
        content={"success": False, "message": user_friendly_message}
    )
    
    # 2. FORCE CORS HEADERS ON THE RESPONSE MANUALLY
    # This prevents the browser from generating a "Network Error"
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response