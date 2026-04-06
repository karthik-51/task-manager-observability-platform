import json
import time
from typing import Any, Dict, List

import requests

from config.settings import Settings
from utils.logger import get_logger


class LLMAnalysisService:
    def __init__(self) -> None:
        self.logger = get_logger("llm_analysis_service")
        self.api_key = Settings.GROQ_API_KEY
        self.base_url = Settings.GROQ_BASE_URL.rstrip("/")
        self.model = Settings.GROQ_MODEL
        self.timeout = Settings.GROQ_TIMEOUT_SECONDS

    def analyze(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key or self.api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY is missing or invalid in .env")

        prompt = self._build_prompt(incident)
        max_retries = 3
        backoff_seconds = 2

        for _ in range(max_retries):
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "temperature": 0.1,
                    "max_tokens": 400,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a senior DevOps, SRE, and CI/CD incident analyst. "
                                "Analyze Jenkins, Docker, backend, deployment, and infrastructure failures. "
                                "Use only the provided logs and metadata. "
                                "Do not give vague answers like 'unknown reason' unless evidence is truly insufficient. "
                                "Prefer a specific technical root cause. "
                                "Return only valid JSON."
                            ),
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        },
                    ],
                },
                timeout=self.timeout,
            )

            if response.status_code == 200:
                payload = response.json()
                content = payload["choices"][0]["message"]["content"].strip()
                parsed = self._safe_parse_json(content)

                likely_root_cause = parsed.get("likely_root_cause") or parsed.get("root_cause") or "Unknown"
                evidence = parsed.get("evidence", [])
                recommended_actions = parsed.get("recommended_actions") or parsed.get("recommended_action", [])
                confidence = parsed.get("confidence", "low")
                top_possible_causes = parsed.get("top_possible_causes", [])

                if isinstance(evidence, str):
                    evidence = [evidence]

                if isinstance(recommended_actions, str):
                    recommended_actions = [recommended_actions]

                normalized_causes = self._normalize_ranked_causes(top_possible_causes)

                if not normalized_causes and likely_root_cause:
                    normalized_causes = [{"cause": likely_root_cause, "score": 1.0}]

                return {
                    "likely_root_cause": likely_root_cause,
                    "root_cause": likely_root_cause,
                    "top_possible_causes": normalized_causes,
                    "evidence": evidence[:5],
                    "recommended_actions": recommended_actions[:5],
                    "recommended_action": recommended_actions[:5],
                    "confidence": confidence,
                }

            if response.status_code == 429:
                retry_after = response.headers.get("retry-after")
                try:
                    wait_seconds = int(float(retry_after)) if retry_after else backoff_seconds
                except (TypeError, ValueError):
                    wait_seconds = backoff_seconds

                self.logger.warning("Groq rate limit hit. Retrying in %s seconds...", wait_seconds)
                time.sleep(wait_seconds)
                backoff_seconds *= 2
                continue

            raise RuntimeError(
                f"Groq request failed: status={response.status_code}, body={response.text}"
            )

        raise RuntimeError("Groq request failed after retries due to rate limiting")

    def _build_prompt(self, incident: Dict[str, Any]) -> str:
        evidence_lines: List[str] = incident.get("evidence_lines", [])[-8:]
        matched_logs: List[str] = incident.get("matched_logs", [])[-5:]

        evidence_text = "\n".join(evidence_lines) if evidence_lines else "No evidence lines available"
        matched_logs_text = "\n".join(matched_logs) if matched_logs else "No grouped matched logs available"
        recent_logs = incident.get("recent_log_text", "")[:1800]

        return f"""
Return ONLY valid JSON in this exact format:
{{
  "likely_root_cause": "specific technical root cause",
  "top_possible_causes": [
    {{"cause": "most likely cause", "score": 0.91}},
    {{"cause": "second possible cause", "score": 0.73}},
    {{"cause": "third possible cause", "score": 0.28}}
  ],
  "evidence": ["exact evidence line 1", "exact evidence line 2"],
  "recommended_actions": ["specific fix step 1", "specific fix step 2", "specific fix step 3"],
  "confidence": "high|medium|low"
}}

Incident Metadata:
- source_kind: {incident.get("source_kind", "unknown")}
- component: {incident.get("component", "unknown")}
- rule_name: {incident.get("rule_name", "unknown")}
- severity: {incident.get("severity", "unknown")}
- source_file: {incident.get("source_file", "unknown")}
- host: {incident.get("host", "unknown")}
- stage_name: {incident.get("stage_name", "unknown")}
- failed_command: {incident.get("failed_command", "unknown")}
- exit_code_line: {incident.get("exit_code_line", "unknown")}
- match_count: {incident.get("match_count", 0)}

Grouped Matched Logs:
{matched_logs_text}

Evidence Lines:
{evidence_text}

Recent Logs:
{recent_logs}

Rules:
- Identify the most likely technical root cause using the provided logs.
- top_possible_causes must contain up to 3 ranked causes with scores between 0 and 1.
- The first cause should match likely_root_cause as closely as possible.
- Quote only the most relevant evidence.
- Give specific and actionable remediation steps.
- Do not return markdown.
- Do not return explanatory text outside JSON.
""".strip()

    def _safe_parse_json(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            cleaned = self._extract_json_block(content)
            if cleaned:
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    pass

        return {
            "likely_root_cause": "LLM returned non-JSON or malformed output.",
            "top_possible_causes": [
                {"cause": "LLM returned non-JSON or malformed output.", "score": 0.5}
            ],
            "evidence": [content[:500]],
            "recommended_actions": [
                "Review the evidence lines sent to the LLM.",
                "Reduce prompt size further.",
                "Use heuristic analysis where possible.",
            ],
            "confidence": "low",
        }

    @staticmethod
    def _extract_json_block(content: str) -> str:
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1 or end <= start:
            return ""

        return content[start:end + 1]

    @staticmethod
    def _normalize_ranked_causes(top_possible_causes: Any) -> List[Dict[str, Any]]:
        if not isinstance(top_possible_causes, list):
            return []

        normalized_causes: List[Dict[str, Any]] = []

        for item in top_possible_causes[:3]:
            if not isinstance(item, dict):
                continue

            cause = str(item.get("cause", "")).strip()
            score = item.get("score", 0)

            try:
                score = float(score)
            except (TypeError, ValueError):
                score = 0.0

            if not cause:
                continue

            if score < 0:
                score = 0.0
            if score > 1:
                score = 1.0

            normalized_causes.append({
                "cause": cause,
                "score": round(score, 2),
            })

        return normalized_causes
