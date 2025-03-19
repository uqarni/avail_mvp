import json
from typing import List, Dict, Any
from pydantic import BaseModel

from gepeto import Gepeto

from app.entities.sample.models.functions_whitelist import CSSWhitelist, create_avail_whitelist
from app.core.config import settings
from app.monitoring.logging import get_logger

logger = get_logger("gepeto")


class MessageHistory(BaseModel):
    role: str
    content: str


class GepetoRun:
    def __init__(self):
        self.avail = Gepeto(api_key=settings.GEPETO_API_KEY)
        try:
            self.whitelist = CSSWhitelist.load()
            logger.info("CSS Whitelist loaded successfully")
        except FileNotFoundError:
            logger.warning("CSS Whitelist file not found, creating new one")
            self.whitelist = create_avail_whitelist()
            self.whitelist.save()
        except Exception as e:
            logger.error(f"Error loading CSS Whitelist: {e}")
            self.whitelist = create_avail_whitelist()

    def _get_agent(self):
        try:
            return self.avail.agents.get("avail chatbot")
        except Exception as e:
            logger.error(f"Error getting agent 'avail chatbot': {e}")
            raise

    def _append_message(self, message: str) -> List[Dict[str, Any]]:
        try:
            css_whitelist_ai = self.whitelist.export_for_ai()
            message_history = [
                MessageHistory(role="system", content=str(css_whitelist_ai)),
                MessageHistory(role="user", content=message)
            ]
            return [msg.model_dump() for msg in message_history]
        except Exception as e:
            logger.error(f"Error preparing messages: {e}")
            raise

    @staticmethod
    def _format_response(response: str):
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Agent returned invalid JSON response: {e}")
            logger.debug(f"Raw response: {response}")
            return {"error": "Invalid response format from agent", "raw": response[:100] + "..."}
        except Exception as e:
            logger.error(f"Unexpected error formatting response: {e}")
            raise

    def call_agent(self, message: str) -> Dict[str, Any]:
        try:
            logger.info(f"Calling Gepeto agent with message of length {len(message)}")

            agent = self._get_agent()
            messages = self._append_message(message)

            response = self.avail.agents.run(
                agent,
                messages,
                {},
                False,
                1,
                True
            )

            if not response.messages:
                logger.error("No messages in response from agent")
                return {"error": "No response from agent"}

            return self._format_response(response.messages[0]["content"])
        except Exception as e:
            logger.error(f"Error calling Gepeto: {e}", exc_info=True)
            return {"error": f"Service unavailable: {str(e)}"}


def call_gepeto(message: str) -> Dict[str, Any]:
    try:
        gepeto_run = GepetoRun()
        return gepeto_run.call_agent(message)
    except Exception as e:
        logger.error(f"Unhandled error in call_gepeto: {e}", exc_info=True)
        return {"error": "Service error", "details": str(e)}