import time
from typing import Any, Dict, Tuple

from analyzers.formatter import build_email_body, build_email_subject
from clients.smtp_client import SMTPClient
from config.settings import Settings
from utils.logger import get_logger


class AlertService:
    def __init__(self) -> None:
        self.smtp_client = SMTPClient()
        self.logger = get_logger("alert_service")
        self.last_sent_time: Dict[Tuple[str, str, str], float] = {}

    def _cache_key(self, incident: Dict[str, Any]) -> Tuple[str, str, str]:
        return (
            incident.get("rule_name", "unknown"),
            incident.get("affected_component", incident.get("component", "unknown")),
            incident.get("source_file", "unknown"),
        )

    def should_send(self, incident: Dict[str, Any]) -> bool:
        key = self._cache_key(incident)
        now = time.time()
        last_sent = self.last_sent_time.get(key)

        if last_sent is None:
            return True

        return (now - last_sent) >= Settings.ALERT_COOLDOWN_SECONDS

    def send_alert(self, incident: Dict[str, Any]) -> bool:
        if not self.should_send(incident):
            self.logger.info("Skipping duplicate alert within cooldown window")
            return False

        subject = build_email_subject(incident)
        body = build_email_body(incident)

        try:
            self.smtp_client.send_email(subject, body)
            self.last_sent_time[self._cache_key(incident)] = time.time()
            self.logger.info("Alert email sent successfully")
            return True
        except Exception as exc:
            self.logger.error("Failed to send alert email: %s", exc)
            raise
