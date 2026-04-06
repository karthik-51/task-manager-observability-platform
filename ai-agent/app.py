import time
from typing import Any, Callable, Dict, List

from analyzers.incident_detector import IncidentDetector
from analyzers.incident_grouper import IncidentGrouper
from analyzers.rules import analyze_root_cause
from clients.opensearch_client import OpenSearchClient
from config.settings import Settings
from services.alert_service import AlertService
from services.incident_service import IncidentService
from services.llm_analysis_service import LLMAnalysisService
from services.log_service import LogService
from utils.logger import get_logger


class MonitoringAgent:
    def __init__(self) -> None:
        self.logger = get_logger("monitoring_agent")

        # Shared OpenSearch client
        self.opensearch_client = OpenSearchClient()

        # Services
        self.log_service = LogService(self.opensearch_client)
        self.detector = IncidentDetector()
        self.grouper = IncidentGrouper()
        self.alert_service = AlertService()
        self.incident_service = IncidentService(self.opensearch_client)
        self.llm_service = LLMAnalysisService()

        self.poll_interval = Settings.POLL_INTERVAL_SECONDS

    def _detect_incidents(
        self,
        hits: List[Dict[str, Any]],
        source_kind: str,
    ) -> List[Dict[str, Any]]:
        incidents: List[Dict[str, Any]] = []

        for hit in hits:
            try:
                source = hit.get("_source", {})
                incident = self.detector.detect_from_source(source, source_kind=source_kind)
                if incident:
                    incidents.append(incident)
            except Exception as exc:
                self.logger.error(
                    "Failed to detect incident from %s log hit: %s",
                    source_kind,
                    exc,
                )

        return incidents

    def _analyze_incident(self, enriched_incident: Dict[str, Any]) -> Dict[str, Any]:
        heuristic_result = analyze_root_cause(
            enriched_incident.get("evidence_lines", []),
            enriched_incident,
        )

        if heuristic_result:
            self.logger.info("Incident analyzed using heuristics")

            likely_root_cause = heuristic_result.get("likely_root_cause", "Incident detected")
            recommended_actions = heuristic_result.get("recommended_actions", [])
            top_possible_causes = heuristic_result.get("top_possible_causes", [])

            if not top_possible_causes and likely_root_cause:
                top_possible_causes = [
                    {
                        "cause": likely_root_cause,
                        "score": 1.0,
                    }
                ]

            return {
                **enriched_incident,
                **heuristic_result,
                "analysis_source": "heuristic",
                "summary": likely_root_cause,
                "affected_component": enriched_incident.get("component", "unknown"),
                "root_cause": likely_root_cause,
                "recommended_actions": recommended_actions,
                "recommended_action": recommended_actions,
                "top_possible_causes": top_possible_causes,
            }

        self.logger.info("Incident sent to LLM for deeper analysis")
        llm_result = self.llm_service.analyze(enriched_incident)

        likely_root_cause = llm_result.get("likely_root_cause") or llm_result.get("root_cause", "Unknown")
        recommended_actions = llm_result.get("recommended_actions") or llm_result.get("recommended_action", [])
        top_possible_causes = llm_result.get("top_possible_causes", [])

        if not top_possible_causes and likely_root_cause:
            top_possible_causes = [
                {
                    "cause": likely_root_cause,
                    "score": 1.0,
                }
            ]

        return {
            **enriched_incident,
            **llm_result,
            "analysis_source": "llm",
            "summary": likely_root_cause,
            "affected_component": enriched_incident.get("component", "unknown"),
            "root_cause": likely_root_cause,
            "recommended_actions": recommended_actions,
            "recommended_action": recommended_actions,
            "top_possible_causes": top_possible_causes,
        }

    def _process_grouped_incidents(
        self,
        grouped_incidents: List[Dict[str, Any]],
        source_hits: List[Dict[str, Any]],
    ) -> None:
        self.logger.info("Unique grouped incidents: %s", len(grouped_incidents))

        for grouped_incident in grouped_incidents:
            try:
                self.logger.warning(
                    "Grouped incident detected | source=%s | component=%s | rule=%s | file=%s",
                    grouped_incident.get("source_kind"),
                    grouped_incident.get("component"),
                    grouped_incident.get("rule_name"),
                    grouped_incident.get("source_file"),
                )

                enriched_incident = self.detector.extract_context(grouped_incident, source_hits)

                self.logger.info("Context enrichment complete")
                self.logger.info("Stage: %s", enriched_incident.get("stage_name"))
                self.logger.info("Failed command: %s", enriched_incident.get("failed_command"))
                self.logger.info(
                    "Evidence lines: %s",
                    len(enriched_incident.get("evidence_lines", [])),
                )

                if not self.alert_service.should_send(enriched_incident):
                    self.logger.info("Duplicate alert skipped before LLM analysis")
                    continue

                analyzed_incident = self._analyze_incident(enriched_incident)

                self.logger.info(
                    "Likely root cause: %s",
                    analyzed_incident.get(
                        "likely_root_cause",
                        analyzed_incident.get("root_cause"),
                    ),
                )
                self.logger.info(
                    "Analysis source: %s",
                    analyzed_incident.get("analysis_source"),
                )

                ranked = analyzed_incident.get("top_possible_causes", [])
                if ranked:
                    for idx, item in enumerate(ranked[:3], start=1):
                        self.logger.info(
                            "Ranked cause %s: %s (score=%s)",
                            idx,
                            item.get("cause", "unknown"),
                            item.get("score", 0),
                        )

                self.incident_service.store_incident(analyzed_incident)

                was_sent = self.alert_service.send_alert(analyzed_incident)
                if was_sent:
                    self.logger.info("Alert email sent")
                else:
                    self.logger.info("Duplicate alert skipped")

            except Exception as exc:
                self.logger.error("Failed to process grouped incident: %s", exc)

    def _check_opensearch_health(self) -> bool:
        try:
            ping_ok = self.opensearch_client.ping()
            self.logger.info("OpenSearch ping status: %s", ping_ok)

            if not ping_ok:
                self.logger.error("OpenSearch ping failed")
                return False

            return True

        except Exception as exc:
            self.logger.error("OpenSearch health check failed: %s", exc)
            return False

    def _process_source(
        self,
        source_name: str,
        fetch_method: Callable[[], List[Dict[str, Any]]],
        source_kind: str,
    ) -> None:
        try:
            self.logger.info("Fetching recent %s logs...", source_name)
            hits = fetch_method()
            self.logger.info("%s logs fetched: %s", source_name.capitalize(), len(hits))

            incidents = self._detect_incidents(hits, source_kind=source_kind)
            self.logger.info("%s matched incidents: %s", source_name.capitalize(), len(incidents))

            grouped_incidents = self.grouper.group(incidents)
            self._process_grouped_incidents(grouped_incidents, hits)

        except Exception as exc:
            self.logger.error("Failed while processing %s logs: %s", source_name, exc)

    def run_once(self) -> None:
        if not self._check_opensearch_health():
            return

        self._process_source(
            source_name="docker",
            fetch_method=self.log_service.get_docker_logs,
            source_kind="docker",
        )

        self._process_source(
            source_name="jenkins",
            fetch_method=self.log_service.get_jenkins_logs,
            source_kind="jenkins",
        )

    def run_forever(self) -> None:
        self.logger.info("AI monitoring agent started")
        self.logger.info("Poll interval: %s seconds", self.poll_interval)

        while True:
            try:
                self.run_once()
            except KeyboardInterrupt:
                self.logger.info("Monitoring agent stopped by user")
                break
            except Exception as exc:
                self.logger.error("Monitoring cycle failed: %s", exc)

            time.sleep(self.poll_interval)


if __name__ == "__main__":
    MonitoringAgent().run_forever()
