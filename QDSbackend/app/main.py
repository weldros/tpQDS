from fastapi import FastAPI, Depends

from app.database.database import Base, engine
from app.database import models
from app.dependencies import get_current_user
from app.routers import auth, signatures
from app.dependencies import get_current_user, require_role


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Quantum-Inspired Cyber Threat Detection API",
    version="1.0.0"
)


app.include_router(auth.router)
app.include_router(signatures.router)


@app.get("/")
def root():
    return {
        "message": "Quantum Cyber Threat Detection API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/db-test")
def database_test():
    return {
        "database": "connected"
    }


@app.get("/protected")
def protected_route(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "You accessed a protected endpoint",
        "user": current_user
    }
    
@app.get("/signer-test")
def signer_test(
    current_user: dict = Depends(
        require_role("signer")
    )
):
    return {
        "message": "Signer access granted",
        "user": current_user
    }