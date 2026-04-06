from typing import Any, Dict, List

from clients.opensearch_client import OpenSearchClient
from config.settings import Settings


class LogService:
    def __init__(self, client: OpenSearchClient) -> None:
        self.client = client

    def get_docker_logs(self) -> List[Dict[str, Any]]:
        return self.client.search_recent_logs(
            index_pattern=Settings.OPENSEARCH_DOCKER_INDEX,
            size=Settings.LOG_FETCH_SIZE,
            minutes=Settings.LOG_LOOKBACK_MINUTES,
        )

    def get_jenkins_logs(self) -> List[Dict[str, Any]]:
        return self.client.search_recent_logs(
            index_pattern=Settings.OPENSEARCH_JENKINS_INDEX,
            size=Settings.LOG_FETCH_SIZE,
            minutes=Settings.LOG_LOOKBACK_MINUTES,
        )
