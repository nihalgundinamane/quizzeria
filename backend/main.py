from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import round01, round02, round03, round04, round05, round07, round08

app = FastAPI(title="Quizzeria API")

# Allow all origins for dev; replace with your deployed frontend URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(round01.router, prefix="/api/round01")
app.include_router(round02.router, prefix="/api/round02")
app.include_router(round03.router, prefix="/api/round03")
app.include_router(round04.router, prefix="/api/round04")
app.include_router(round05.router, prefix="/api/round05")
app.include_router(round07.router, prefix="/api/round07")
app.include_router(round08.router, prefix="/api/round08")

@app.get("/")
def root():
    return {"status": "Quizzeria API running", "rounds": [1,2,3,4,5,7,8]}
