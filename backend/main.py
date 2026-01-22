from fastapi import FastAPI
from backend.quantum_service import quantum_service

app = FastAPI()

@app.get("/quantum-spin")
async def get_quantum_spin():
    return quantum_service.get_spin()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
