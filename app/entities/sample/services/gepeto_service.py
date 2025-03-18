import json
from typing import List, Dict, Any
from pydantic import BaseModel

from gepeto import Gepeto

from app.core.config import settings
from app.monitoring.logging import get_logger

logger = get_logger("gepeto")


class MessageHistory(BaseModel):
    role: str
    content: str


class GepetoRun:
    def __init__(self):
        self.avail = Gepeto(api_key=settings.GEPETO_API_KEY)

    def _get_agent(self):
        return self.avail.agents.get("avail chatbot")

    @staticmethod
    def _append_message(message: str) -> List[Dict[str, Any]]:
        return [MessageHistory(role="user", content=message).model_dump()]

    @staticmethod
    def _format_response(response: str):
        try:
            return json.loads(response)
        except Exception as e:
            logger("Agent returned invalid JSON response")
            raise e

    def call_agent(self, message: str) -> Dict[str, Any]:
        try:
            response = self.avail.agents.run(
                self._get_agent(),
                self._append_message(message),
                {},
                False,
                1,
                True
            )

            return self._format_response(response.messages[0]["content"])
        except Exception as e:
            logger(f"Error calling Gepeto: {e}")
            raise e


def call_gepeto(message: str) -> Dict[str, Any]:
    gepeto_run = GepetoRun()
    return gepeto_run.call_agent(message)