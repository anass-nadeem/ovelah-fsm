from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.auth import create_token, is_password_set, verify_password


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(login_data: LoginRequest):
    if not is_password_set():
        raise HTTPException(
            status_code=500,
            detail=(
                "No app password has been set up yet. Run "
                "set_password.py from the backend folder first."
            ),
        )

    if not verify_password(login_data.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password.",
        )

    return {"token": create_token()}