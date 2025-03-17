from typing import List, Dict, Any

import requests
from pydantic import BaseModel

from app.core.config import settings


class MessageHistory(BaseModel):
    role: str
    content: str


class PostBody(BaseModel):
    debug: bool
    message_history: List[MessageHistory]
    variable_inputs: Dict[str, Any]
    prompt_version_id: int



def call_gepeto(message: str) -> Dict[str, Any]:
    headers = {
        "x-api-key": settings.GEPETO_API_KEY
    }

    message_history = [MessageHistory(role="user", content=message)]

    post_body = PostBody(
        debug=False,
        message_history=message_history,
        variable_inputs={},
        prompt_version_id=settings.GEPETO_PROMPT_VERSION_ID
    )

    response = requests.post(
        settings.GEPETO_API_URL, json=post_body.model_dump(), headers=headers
    )

    return response.json()["response_object"]