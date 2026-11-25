import os
from contextlib import asynccontextmanager
from hmac import compare_digest

from fastapi import FastAPI, Header, HTTPException, Response

from backend.quantum_service import QuantumEntropyService

entropy = QuantumEntropyService()


@asynccontextmanager
async def lifespan(_: FastAPI):
    entropy.ensure_connection()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "configured": entropy.configured,
        "access_configured": bool(os.environ.get("QUANTUM_ACCESS_CODE")),
        "hardware_connected": entropy.backend is not None,
        "backend": entropy.backend.name if entropy.backend is not None else None,
    }


@app.post("/quantum-spin")
def spin(response: Response, x_quantum_access: str = Header(default="")):
    expected = os.environ.get("QUANTUM_ACCESS_CODE")
    if not expected:
        raise HTTPException(503, "Hardware access is not configured")
    if not compare_digest(x_quantum_access.encode(), expected.encode()):
        raise HTTPException(401, "Invalid hardware access code")

    response.headers["Cache-Control"] = "no-store"
    return entropy.get_spin()
