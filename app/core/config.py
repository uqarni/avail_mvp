import os
# import boto3
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

from app.monitoring.logging import get_logger

logger = get_logger('config')

# def fetch_parameters_by_path(environment: str) -> dict:
#     """
#     Fetch all parameters for a specific environment from AWS Parameter Store.

#     Args:
#         environment: The environment name (dev, staging, prod, etc.)
#     Returns:
#         dict: Dictionary of parameter names and values
#     """
#     if environment == "local":
#         logger.info("Using local environment, skipping AWS Parameter Store")
#         return {}

#     ssm_client = boto3.client("ssm", region_name="us-east-1")

#     try:
#         paginator = ssm_client.get_paginator("get_parameters_by_path")
#         parameters = {}

#         # Use pagination to handle large number of parameters efficiently
#         for page in paginator.paginate(
#             Path=f"/gepeto-server/{environment}", Recursive=True, WithDecryption=True
#         ):
#             for param in page["Parameters"]:
#                 name = param["Name"].split("/")[-1]
#                 value = param["Value"]
#                 parameters[name] = value
#                 os.environ[name.upper()] = value

#         return parameters

#     except Exception as e:
#         logger.error(
#             f"Failed to fetch parameters for environment {environment}: {str(e)}"
#         )
#         raise


class Settings(BaseSettings):
    # Load environment variables from .env file and AWS Parameters
    load_dotenv()
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "dev")

    # Fetch parameters before initializing other settings
    # fetch_parameters_by_path(ENVIRONMENT)

    # Project Name
    PROJECT_NAME: str = "Agent Builder"

    # Postgres
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB")
    DATABASE_URL: str = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"
    )

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str | None = os.getenv("REDIS_PASSWORD")

    # Gepeto
    GEPETO_API_URL: str = os.getenv("GEPETO_API_URL")
    GEPETO_API_KEY: str = os.getenv("GEPETO_API_KEY")
    GEPETO_PROMPT_VERSION_ID: int = 175

settings = Settings()