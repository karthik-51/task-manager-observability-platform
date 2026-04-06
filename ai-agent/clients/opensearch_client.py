from typing import Any, Dict, List

from opensearchpy import OpenSearch

from config.settings import Settings
from utils.logger import get_logger


class OpenSearchClient:
    def __init__(self) -> None:
        self.logger = get_logger("opensearch_client")

        self.logger.info(
            "OpenSearch config loaded | host=%s | port=%s | use_ssl=%s | verify_certs=%s",
            Settings.OPENSEARCH_HOST,
            Settings.OPENSEARCH_PORT,
            Settings.OPENSEARCH_USE_SSL,
            Settings.OPENSEARCH_VERIFY_CERTS,
        )

        self.client = OpenSearch(
            hosts=[
                {
                    "host": Settings.OPENSEARCH_HOST,
                    "port": Settings.OPENSEARCH_PORT,
                }
            ],
            http_auth=(Settings.OPENSEARCH_USER, Settings.OPENSEARCH_PASSWORD),
            use_ssl=Settings.OPENSEARCH_USE_SSL,
            verify_certs=Settings.OPENSEARCH_VERIFY_CERTS,
            ssl_assert_hostname=False,
            ssl_show_warn=False,
            timeout=60,
            max_retries=3,
            retry_on_timeout=True,
        )

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except Exception as exc:
            self.logger.error("OpenSearch ping exception: %s", exc)
            return False

    def search_recent_logs(self, index_pattern: str, size: int, minutes: int) -> List[Dict[str, Any]]:
        query = {
            "size": size,
            "track_total_hits": True,
            "sort": [{"@timestamp": {"order": "desc"}}],
            "query": {
                "bool": {
                    "filter": [
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": f"now-{minutes}m",
                                    "lte": "now",
                                }
                            }
                        }
                    ]
                }
            },
        }

        response = self.client.search(index=index_pattern, body=query)
        return response.get("hits", {}).get("hits", [])

    def index_document(self, index_name: str, document: Dict[str, Any]) -> None:
        self.client.index(index=index_name, body=document)
