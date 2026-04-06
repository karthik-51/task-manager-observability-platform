from collections import defaultdict
from typing import Any, Dict, List, Tuple


class IncidentGrouper:
    def group(self, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        grouped: Dict[Tuple[str, str, str, str], List[Dict[str, Any]]] = defaultdict(list)

        for incident in incidents:
            key = (
                incident["source_kind"],
                incident["rule_name"],
                incident["component"],
                incident["source_file"],
            )
            grouped[key].append(incident)

        grouped_incidents: List[Dict[str, Any]] = []

        for items in grouped.values():
            first = items[0]
            latest = sorted(items, key=lambda x: str(x.get("timestamp", "")), reverse=True)[0]

            grouped_incidents.append(
                {
                    "source_kind": first["source_kind"],
                    "rule_name": first["rule_name"],
                    "component": first["component"],
                    "severity": first.get("severity", "unknown"),
                    "source_file": first["source_file"],
                    "host": first["host"],
                    "timestamp": latest["timestamp"],
                    "match_count": len(items),
                    "matched_logs": [item["message"] for item in items[:20]],
                    "first_message": first.get("message", ""),
                    "last_message": latest.get("message", ""),
                }
            )

        return grouped_incidents
