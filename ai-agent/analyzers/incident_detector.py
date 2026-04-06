from typing import Any, Dict, List, Optional

from analyzers.rules import DOCKER_RULES, ERROR_KEYWORDS, JENKINS_RULES


class IncidentDetector:
    DATABASE_HINTS = [
        "mongo",
        "mongodb",
        "mongoservererror",
        "mongoserverselectionerror",
        "atlaserror",
        "database connection failed",
        "bad auth",
        "server selection timed out",
        "authentication failed",
    ]

    @staticmethod
    def _extract_message(source: Dict[str, Any]) -> str:
        parts: List[str] = []

        for key in ("log", "message", "msg"):
            value = source.get(key)
            if isinstance(value, str) and value.strip():
                parts.append(value.strip())

        if not parts:
            parts.append(str(source))

        return " | ".join(parts)

    @staticmethod
    def _extract_source_file(source: Dict[str, Any]) -> str:
        source_file = source.get("source_file")
        if isinstance(source_file, str) and source_file.strip():
            return source_file.strip()

        log_field = source.get("log")
        if isinstance(log_field, dict):
            file_field = log_field.get("file")
            if isinstance(file_field, dict):
                path = file_field.get("path")
                if isinstance(path, str) and path.strip():
                    return path.strip()

        return "unknown"

    @staticmethod
    def _extract_host(source: Dict[str, Any]) -> str:
        host = source.get("host", "unknown")
        if isinstance(host, dict):
            hostname = host.get("name") or host.get("hostname")
            if hostname:
                return str(hostname)
        return str(host)

    def _match_rules(self, message: str, rules: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        lowered = message.lower()

        if any(hint in lowered for hint in self.DATABASE_HINTS):
            for rule in rules:
                if rule["name"] == "database_connection_issue":
                    if any(pattern.lower() in lowered for pattern in rule["patterns"]):
                        return rule

        for rule in rules:
            if any(pattern.lower() in lowered for pattern in rule["patterns"]):
                return rule

        return None

    def detect_from_source(self, source: Dict[str, Any], source_kind: str) -> Optional[Dict[str, Any]]:
        message = self._extract_message(source)
        rules = DOCKER_RULES if source_kind == "docker" else JENKINS_RULES
        matched_rule = self._match_rules(message, rules)

        if not matched_rule:
            return None

        return {
            "rule_name": matched_rule["name"],
            "severity": matched_rule["severity"],
            "component": matched_rule["component"],
            "message": message,
            "timestamp": source.get("@timestamp", "unknown"),
            "host": self._extract_host(source),
            "source_file": self._extract_source_file(source),
            "source_kind": source_kind,
        }

    def extract_context(self, grouped_incident: Dict[str, Any], hits: List[Dict[str, Any]]) -> Dict[str, Any]:
        relevant_lines: List[str] = []
        all_lines: List[str] = []
        grouped_file = str(grouped_incident.get("source_file", "unknown")).strip()

        for hit in hits:
            source = hit.get("_source", {})
            message = self._extract_message(source)
            if not message:
                continue

            source_file = self._extract_source_file(source)
            if grouped_file != "unknown" and source_file != "unknown" and source_file != grouped_file:
                continue

            all_lines.append(message)

            lower_message = message.lower()
            if any(keyword in lower_message for keyword in ERROR_KEYWORDS):
                relevant_lines.append(message)

        if not relevant_lines:
            relevant_lines = all_lines[-20:]

        stage_name = self._extract_stage_name(all_lines)
        failed_command = self._extract_failed_command(all_lines)
        exit_code_line = self._extract_exit_code(relevant_lines if relevant_lines else all_lines)

        return {
            **grouped_incident,
            "stage_name": stage_name,
            "failed_command": failed_command,
            "exit_code_line": exit_code_line,
            "evidence_lines": relevant_lines[-25:],
            "recent_log_text": "\n".join(all_lines[-50:]),
        }

    @staticmethod
    def _extract_stage_name(lines: List[str]) -> str:
        for line in reversed(lines):
            lower_line = line.lower()
            if "stage" in lower_line or "[pipeline]" in lower_line:
                return line[:300]
        return "unknown"

    @staticmethod
    def _extract_failed_command(lines: List[str]) -> str:
        command_markers = [
            "docker build",
            "docker compose",
            "docker-compose",
            "npm install",
            "npm run build",
            "npm run test",
            "python ",
            "pytest",
            "mvn ",
            "gradle ",
            "git ",
            "ssh ",
        ]

        for line in reversed(lines):
            lower_line = line.lower()
            for marker in command_markers:
                if marker in lower_line:
                    return line[:300]

        return "unknown"

    @staticmethod
    def _extract_exit_code(lines: List[str]) -> str:
        for line in reversed(lines):
            if "exit code" in line.lower():
                return line[:300]
        return "unknown"
