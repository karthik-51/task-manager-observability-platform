from datetime import datetime, timezone
from typing import Any, Dict

from clients.opensearch_client import OpenSearchClient
from config.settings import Settings


class IncidentService:
    def __init__(self, client: OpenSearchClient) -> None:
        self.client = client

    def store_incident(self, incident_document: Dict[str, Any]) -> None:
        payload = dict(incident_document)
        payload["stored_at"] = datetime.now(timezone.utc).isoformat()

        self.client.index_document(
            index_name=Settings.OPENSEARCH_INCIDENT_INDEX,
            document=payload,
        )
