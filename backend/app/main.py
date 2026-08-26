from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    close_neo4j_connection,
    verify_neo4j_connection,
)

from app.routers.trends import router as trends_router
from app.routers.simulation import router as simulation_router
from app.routers.trend_flow import router as trend_flow_router
from app.api.graphrag import router as graphrag_router
from app.voice.router import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    verify_neo4j_connection()
    print("✅ Neo4j 연결 성공")

    yield

    close_neo4j_connection()
    print("🔌 Neo4j 연결 종료")


app = FastAPI(
    title="Trend Flow API",
    description="GraphDB 기반 패션 유행 흐름 분석 API",
    version="1.0.0",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(trends_router)
app.include_router(simulation_router)
app.include_router(trend_flow_router)
app.include_router(graphrag_router)
app.include_router(voice_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "service": "Trend Flow API",
        "status": "running",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "neo4j": "connected",
    }