import os
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Configure production-ready startup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - [%(name)s] - %(message)s")
logger = logging.getLogger("LexGuard-AI")

# Load environmental configs
load_dotenv()

# Import APIRouters
from .routes import analyze, chat, policies, intelligence

# Initialize FastAPI App
app = FastAPI(
    title="LexGuard AI Backend Gateway",
    description="High-fidelity AI-powered Legal Compliance Guard & Redlining Platform Engine.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Supports direct dev server requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Endpoints
app.include_router(analyze.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(policies.router, prefix="/api")
app.include_router(intelligence.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Startup hook to log server initialization and prepare multi-agent systems."""
    logger.info("Initializing LexGuard AI Backend Gateway...")
    logger.info("Multi-agent architecture handlers loaded successfully.")
    logger.info("Ready to process legal documents and apply compliance policies.")

@app.get("/")
async def root():
    """Health check endpoint confirming that LexGuard AI's core engine is fully active."""
    from .services.gemini_client import is_configured, PRIMARY_KEYS, ALPHA_KEYS, BETA_KEYS, GAMMA_KEYS

    return {
        "status": "online",
        "service": "LexGuard AI",
        "description": "Compliance Agent Core & Document Intelligence Engine fully running.",
        "api_docs": "/docs",
        "gemini_configured": is_configured(),
        "gemini_keys": {
            "primary": len(PRIMARY_KEYS),
            "alpha": len(ALPHA_KEYS),
            "beta": len(BETA_KEYS),
            "gamma": len(GAMMA_KEYS),
        },
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting core Uvicorn API server on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
