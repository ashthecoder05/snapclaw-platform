"""
AI Agent Runtime - Telegram Bot with LLM Integration
This container runs as a separate instance per user.
"""
import os
import logging
from fastapi import FastAPI, Request
from openai import AsyncAzureOpenAI
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration from environment variables
BOT_TOKEN = os.getenv("BOT_TOKEN")
TELEGRAM_API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"

# LLM Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
MODEL = os.getenv("MODEL", "gpt-4o")
USER_ID = os.getenv("USER_ID")

# Initialize LLM client
client = AsyncAzureOpenAI(
    api_key=OPENAI_API_KEY,
    api_version="2024-02-15-preview",
    azure_endpoint=OPENAI_ENDPOINT
) if OPENAI_ENDPOINT else None


async def call_llm(message: str) -> str:
    """Call LLM and get response"""
    try:
        if not client:
            return "LLM client not configured"

        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": message}
            ],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return "Sorry, I encountered an error processing your request."


async def send_telegram_message(chat_id: int, text: str):
    """Send message back to Telegram"""
    async with httpx.AsyncClient() as http_client:
        await http_client.post(
            f"{TELEGRAM_API_BASE}/sendMessage",
            json={"chat_id": chat_id, "text": text}
        )


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "user_id": USER_ID}


@app.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Telegram webhook endpoint
    Receives messages, processes with LLM, replies
    """
    try:
        data = await request.json()
        logger.info(f"Received webhook: {data}")

        # Extract message
        if "message" not in data:
            return {"ok": True}

        message = data["message"]
        chat_id = message["chat"]["id"]
        user_message = message.get("text", "")

        if not user_message:
            return {"ok": True}

        # Process with LLM
        reply = await call_llm(user_message)

        # Send response
        await send_telegram_message(chat_id, reply)

        return {"ok": True}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"ok": False, "error": str(e)}


@app.on_event("startup")
async def startup():
    logger.info(f"Agent starting for user: {USER_ID}")
    logger.info(f"Model: {MODEL}")
