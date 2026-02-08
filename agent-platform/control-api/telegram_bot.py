"""
Telegram Bot Integration
Handles Telegram Bot API interactions
"""
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)


class TelegramBot:
    """Telegram Bot API integration"""

    def __init__(self):
        self.base_url = "https://api.telegram.org/bot"

    async def send_welcome_message(self, bot_token: str, chat_id: Optional[str] = None) -> dict:
        """
        Send a welcome message to the user via Telegram bot

        If chat_id is not provided, sends to the bot owner (gets chat_id from getUpdates)
        """
        try:
            # If no chat_id provided, get the latest chat_id from updates
            if not chat_id:
                chat_id = await self._get_chat_id(bot_token)
                if not chat_id:
                    logger.warning("No chat_id found. User needs to send /start to the bot first.")
                    return {
                        "success": False,
                        "message": "Please send /start to your bot on Telegram first"
                    }

            # Send welcome message
            message = "Hi, how can I help you?\n\nNice pairing with OpenClaw! 🎉"

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}{bot_token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": message
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    logger.info(f"Welcome message sent successfully to chat_id: {chat_id}")
                    return {
                        "success": True,
                        "message": "Welcome message sent",
                        "chat_id": chat_id
                    }
                else:
                    logger.error(f"Failed to send message: {response.text}")
                    return {
                        "success": False,
                        "message": f"Failed to send message: {response.text}"
                    }

        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }

    async def _get_chat_id(self, bot_token: str) -> Optional[str]:
        """
        Get the chat_id from the latest update
        Returns the chat_id if user has sent /start to the bot
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{bot_token}/getUpdates",
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get("ok") and data.get("result"):
                        # Get the latest message
                        updates = data["result"]
                        if updates:
                            latest_update = updates[-1]
                            chat_id = latest_update.get("message", {}).get("chat", {}).get("id")
                            return str(chat_id) if chat_id else None

                return None

        except Exception as e:
            logger.error(f"Error getting chat_id: {e}")
            return None

    async def verify_bot_token(self, bot_token: str) -> dict:
        """Verify if the bot token is valid"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}{bot_token}/getMe",
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    if data.get("ok"):
                        bot_info = data.get("result", {})
                        return {
                            "valid": True,
                            "bot_username": bot_info.get("username"),
                            "bot_name": bot_info.get("first_name")
                        }

                return {"valid": False, "error": "Invalid bot token"}

        except Exception as e:
            logger.error(f"Error verifying bot token: {e}")
            return {"valid": False, "error": str(e)}
