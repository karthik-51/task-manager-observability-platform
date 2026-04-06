from typing import Any, Dict, List


def build_email_subject(incident: Dict[str, Any]) -> str:
    severity = str(incident.get("severity", "unknown")).upper()
    component = incident.get("affected_component", incident.get("component", "unknown"))
    rule_name = incident.get("rule_name", "unknown")
    return f"[{severity}] {component} | {rule_name}"


def build_email_body(incident: Dict[str, Any]) -> str:
    recommendations = incident.get("recommended_actions", [])
    if not recommendations:
        fallback = incident.get("recommended_action", [])
        if isinstance(fallback, list):
            recommendations = fallback
        elif fallback:
            recommendations = [str(fallback)]

    recommendation_text = "\n".join(
        [f"{idx + 1}. {item}" for idx, item in enumerate(recommendations)]
    ) or "1. Review the exact failing lines in OpenSearch and Jenkins console logs."

    evidence_lines: List[str] = incident.get("evidence", [])
    if not evidence_lines:
        evidence_lines = incident.get("evidence_lines", [])[:8]

    evidence_text = "\n".join([f"- {line}" for line in evidence_lines]) or "- No evidence lines captured"

    ranked_causes = incident.get("top_possible_causes", [])
    ranked_cause_text = "\n".join(
        [
            f"{idx + 1}. {item.get('cause', 'unknown')} (score: {item.get('score', 0)})"
            for idx, item in enumerate(ranked_causes[:3])
        ]
    ) or "1. No ranked causes available"

    return f"""Incident Summary
{incident.get('summary', 'No summary available')}

Severity:
{incident.get('severity', 'unknown')}

Affected Component:
{incident.get('affected_component', incident.get('component', 'unknown'))}

Rule:
{incident.get('rule_name', 'unknown')}

Source:
{incident.get('source_kind', 'unknown')}

Host:
{incident.get('host', 'unknown')}

Source File:
{incident.get('source_file', 'unknown')}

Time:
{incident.get('timestamp', 'unknown')}

Match Count:
{incident.get('match_count', 0)}

Stage:
{incident.get('stage_name', 'unknown')}

Failed Command:
{incident.get('failed_command', 'unknown')}

Exit Code:
{incident.get('exit_code_line', 'unknown')}

Likely Root Cause:
{incident.get('likely_root_cause', incident.get('root_cause', 'Unknown'))}

Top Possible Causes:
{ranked_cause_text}

Evidence:
{evidence_text}

Recommended Actions:
{recommendation_text}

Confidence:
{incident.get('confidence', 'unknown')}

Analysis Source:
{incident.get('analysis_source', 'unknown')}
"""
