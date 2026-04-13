import os
from dotenv import load_dotenv

load_dotenv()


def to_bool(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes", "y", "on"}


class Settings:
    OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "Opensearch Ec2 Ip Address")
    OPENSEARCH_PORT = int(os.getenv("OPENSEARCH_PORT", "9200"))
    OPENSEARCH_USER = os.getenv("OPENSEARCH_USER", "admin")
    OPENSEARCH_PASSWORD = os.getenv("OPENSEARCH_PASSWORD", "")
    OPENSEARCH_USE_SSL = to_bool(os.getenv("OPENSEARCH_USE_SSL", "true"))
    OPENSEARCH_VERIFY_CERTS = to_bool(os.getenv("OPENSEARCH_VERIFY_CERTS", "false"))

    OPENSEARCH_DOCKER_INDEX = os.getenv("OPENSEARCH_DOCKER_INDEX", "task-deploy-docker-*")
    OPENSEARCH_JENKINS_INDEX = os.getenv("OPENSEARCH_JENKINS_INDEX", "jenkins-logs-*")
    OPENSEARCH_INCIDENT_INDEX = os.getenv("OPENSEARCH_INCIDENT_INDEX", "ai-agent-incidents")

    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    ALERT_FROM = os.getenv("ALERT_FROM", "")
    ALERT_TO = os.getenv("ALERT_TO", "")

    POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "60"))
    LOG_FETCH_SIZE = int(os.getenv("LOG_FETCH_SIZE", "100"))
    LOG_LOOKBACK_MINUTES = int(os.getenv("LOG_LOOKBACK_MINUTES", "5"))
    ALERT_COOLDOWN_SECONDS = int(os.getenv("ALERT_COOLDOWN_SECONDS", "1800"))

    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_TIMEOUT_SECONDS = int(os.getenv("GROQ_TIMEOUT_SECONDS", "30"))
