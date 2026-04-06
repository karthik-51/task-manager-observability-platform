import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

from config.settings import Settings


class SMTPClient:
    def _get_recipients(self) -> List[str]:
        if not Settings.ALERT_TO:
            raise ValueError("ALERT_TO is empty in .env")

        recipients = [
            email.strip()
            for email in str(Settings.ALERT_TO).split(",")
            if email.strip()
        ]

        if not recipients:
            raise ValueError("No valid recipient emails found in ALERT_TO")

        return recipients

    def send_email(self, subject: str, body: str) -> None:
        if not Settings.ALERT_FROM:
            raise ValueError("ALERT_FROM is empty in .env")
        if not Settings.SMTP_USER:
            raise ValueError("SMTP_USER is empty in .env")
        if not Settings.SMTP_PASSWORD:
            raise ValueError("SMTP_PASSWORD is empty in .env")

        recipients = self._get_recipients()

        msg = MIMEMultipart()
        msg["From"] = Settings.ALERT_FROM
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(Settings.SMTP_HOST, Settings.SMTP_PORT) as server:
            server.starttls()
            server.login(Settings.SMTP_USER, Settings.SMTP_PASSWORD)
            server.sendmail(Settings.ALERT_FROM, recipients, msg.as_string())
