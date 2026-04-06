from typing import Dict, List, Optional


DOCKER_RULES = [
    {
        "name": "backend_container_error",
        "patterns": [
            "uncaught exception",
            "fatal error",
            "crash",
            "container exited",
            "exited with code",
            "node:internal",
            "traceback",
            "runtimeerror",
            "typeerror",
            "referenceerror",
            "syntaxerror",
            "cannot find module",
            "module not found",
            "database connection failed",
            "mongoservererror",
            "atlaserror",
            "bad auth",
            "authentication failed",
        ],
        "severity": "high",
        "component": "backend",
    },
    {
        "name": "database_connection_issue",
        "patterns": [
            "mongo connection failed",
            "mongodb connection failed",
            "database connection failed",
            "econnrefused",
            "connection refused",
            "timed out while connecting",
            "mongoserverselectionerror",
            "server selection timed out",
            "mongoservererror",
            "atlaserror",
            "bad auth",
            "authentication failed",
        ],
        "severity": "high",
        "component": "database",
    },
    {
        "name": "missing_environment_variable",
        "patterns": [
            "missing environment variable",
            "env is undefined",
            "jwt_secret is undefined",
            "mongo_uri is undefined",
            "keyerror",
            "missing required environment variable",
        ],
        "severity": "medium",
        "component": "backend",
    },
    {
        "name": "mail_auth_issue",
        "patterns": [
            "eauth",
            "missing credentials for plain",
            "smtp authentication failed",
            "nodemailer",
            "535-5.7.8",
        ],
        "severity": "medium",
        "component": "notification",
    },
]

JENKINS_RULES = [
    {
        "name": "jenkins_build_failed",
        "patterns": [
            "finished: failure",
            "build failed",
            "script returned exit code 1",
            "script returned exit code 2",
            "multiplecompilationerrorsexception",
            "build step 'execute shell' marked build as failure",
        ],
        "severity": "high",
        "component": "jenkins-build",
    },
    {
        "name": "docker_build_issue",
        "patterns": [
            "failed to solve",
            "pull access denied",
            "no such image",
            "docker build",
            "error response from daemon",
            "failed to read dockerfile",
            "executor failed running",
        ],
        "severity": "high",
        "component": "docker-build",
    },
    {
        "name": "deploy_failed",
        "patterns": [
            "deploy failed",
            "permission denied",
            "no such file",
            "host key verification failed",
            "ssh:",
            "connection timed out",
            "connection refused",
        ],
        "severity": "high",
        "component": "deployment",
    },
    {
        "name": "git_checkout_issue",
        "patterns": [
            "repository not found",
            "authentication failed",
            "could not read from remote repository",
            "couldn't find remote ref",
            "fatal: not a git repository",
        ],
        "severity": "medium",
        "component": "git-checkout",
    },
]

ERROR_KEYWORDS = [
    "error",
    "exception",
    "traceback",
    "failed",
    "failure",
    "fatal",
    "exit code",
    "script returned exit code",
    "cannot find module",
    "module not found",
    "permission denied",
    "no such file",
    "not found",
    "timed out",
    "timeout",
    "connection refused",
    "connection reset",
    "denied",
    "unauthorized",
    "forbidden",
    "npm err!",
    "docker:",
    "build failed",
    "pull access denied",
    "authentication failed",
    "bad auth",
    "atlaserror",
    "mongoservererror",
    "database connection failed",
    "invalid",
    "unable to",
    "could not",
    "crash",
    "killed",
]


def analyze_root_cause(evidence_lines: List[str], incident: Optional[Dict] = None) -> Optional[Dict]:
    incident = incident or {}
    text = "\n".join(evidence_lines).lower()
    component = str(incident.get("component", "")).lower()
    rule_name = str(incident.get("rule_name", "")).lower()
    source_kind = str(incident.get("source_kind", "")).lower()

    if not text.strip():
        return None

    if (
        "bad auth" in text
        or "atlaserror" in text
        or "mongoservererror" in text
        or "database connection failed" in text
        or ("authentication failed" in text and ("mongo" in text or "atlas" in text or "database" in text))
        or component == "database"
        or rule_name == "database_connection_issue"
    ):
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "MongoDB authentication failed because the database username/password in MONGO_URI is invalid, expired, or not URL-encoded correctly.",
                "score": 0.91,
            },
            {
                "cause": "The Atlas database user does not have the required permissions for the target database.",
                "score": 0.73,
            },
            {
                "cause": "The backend cannot reliably reach MongoDB because of a network, DNS, or connectivity issue.",
                "score": 0.28,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(
                evidence_lines,
                ["bad auth", "atlaserror", "mongoservererror", "database connection failed", "authentication failed"],
            ),
            "recommended_actions": [
                "Verify the MongoDB Atlas username and password in MONGO_URI.",
                "If the password contains special characters, URL-encode it before placing it in the connection string.",
                "Confirm the Atlas database user exists and has access to the target database.",
                "Test the same connection string manually from the container or host.",
                "After fixing the URI or credentials, restart the backend container.",
            ],
            "confidence": "high",
        }

    if "cannot find module" in text or "module not found" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "Application dependency is missing from package.json or was not installed in the build/runtime environment.",
                "score": 0.89,
            },
            {
                "cause": "The import path is incorrect or the referenced file does not exist in the image/workspace.",
                "score": 0.74,
            },
            {
                "cause": "The Docker build context or .dockerignore excluded the required file/module.",
                "score": 0.46,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["cannot find module", "module not found"]),
            "recommended_actions": [
                "Install the missing package and verify it is listed under dependencies in package.json.",
                "Check the import path and confirm the file exists inside the Docker image or workspace.",
                "Rebuild the image after fixing package installation or file path issues.",
            ],
            "confidence": "high",
        }

    if "missing credentials for plain" in text or "eauth" in text or "smtp authentication failed" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "SMTP authentication failed because the mail username/password is missing or invalid.",
                "score": 0.9,
            },
            {
                "cause": "The mail provider rejected the login because an app password or secure authentication setting is missing.",
                "score": 0.64,
            },
            {
                "cause": "The sender configuration is present but the runtime environment is not loading the correct SMTP variables.",
                "score": 0.41,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(
                evidence_lines,
                ["missing credentials for plain", "eauth", "smtp authentication failed", "nodemailer"],
            ),
            "recommended_actions": [
                "Verify SMTP_USER, SMTP_PASSWORD, ALERT_FROM, and ALERT_TO in the environment.",
                "If using Gmail, use an app password instead of the normal account password.",
                "Restart the backend or AI agent after correcting mail settings.",
            ],
            "confidence": "high",
        }

    if "missing environment variable" in text or "env is undefined" in text or "jwt_secret is undefined" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "The application started without one or more required environment variables.",
                "score": 0.93,
            },
            {
                "cause": "The correct .env file exists but is not being loaded by the service/container.",
                "score": 0.68,
            },
            {
                "cause": "The deployment pipeline overwrote or omitted required runtime variables.",
                "score": 0.43,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(
                evidence_lines,
                ["missing environment variable", "env is undefined", "jwt_secret is undefined", "mongo_uri is undefined"],
            ),
            "recommended_actions": [
                "Review the .env file and deployment environment variables.",
                "Confirm the container or service is loading the correct env file.",
                "Add startup validation for required settings before the app begins serving requests.",
            ],
            "confidence": "high",
        }

    if "npm err!" in text and "404" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "NPM package installation failed because a package name or version could not be resolved.",
                "score": 0.87,
            },
            {
                "cause": "The pipeline is using an outdated lockfile or incorrect registry configuration.",
                "score": 0.55,
            },
            {
                "cause": "The build agent has intermittent network access to the npm registry.",
                "score": 0.29,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["npm err!", "404"]),
            "recommended_actions": [
                "Review package.json for invalid package names or unavailable versions.",
                "Run npm install locally on the same branch to reproduce the exact dependency failure.",
                "Verify outbound network access from Jenkins/Docker to the npm registry.",
            ],
            "confidence": "high",
        }

    if "permission denied" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "The build or deployment step failed because the executing user lacks required permissions.",
                "score": 0.88,
            },
            {
                "cause": "The target file or directory ownership is incorrect for the runtime user.",
                "score": 0.66,
            },
            {
                "cause": "The command requires elevated privileges that are not available in the Jenkins or container context.",
                "score": 0.47,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["permission denied"]),
            "recommended_actions": [
                "Check file permissions and ownership for the affected path or command.",
                "Verify which user Jenkins or Docker is running as.",
                "Grant the minimum required permissions or move artifacts to an accessible path.",
            ],
            "confidence": "high",
        }

    if "no such file" in text or "cannot stat" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "A required file or path referenced by the pipeline or Docker build does not exist.",
                "score": 0.9,
            },
            {
                "cause": "The file name or path casing is incorrect between local development and Linux runtime.",
                "score": 0.63,
            },
            {
                "cause": "The file exists in the repo but is excluded from the Docker build context or current branch.",
                "score": 0.44,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["no such file", "cannot stat"]),
            "recommended_actions": [
                "Verify the referenced file exists in the repo and in the current branch.",
                "Check Docker COPY paths, Jenkins workspace paths, and file name spelling/case.",
                "Confirm the file is included in the build context and not excluded by .dockerignore.",
            ],
            "confidence": "high",
        }

    if (
        "docker-compose: command not found" in text
        or "docker compose: command not found" in text
        or "docker: unknown command" in text
    ):
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "The Jenkins or deployment host does not have the expected Docker Compose command available.",
                "score": 0.92,
            },
            {
                "cause": "The pipeline uses docker-compose but the host only supports docker compose, or vice versa.",
                "score": 0.78,
            },
            {
                "cause": "Docker tooling exists but is not available in the PATH for the executing user.",
                "score": 0.39,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(
                evidence_lines,
                ["docker-compose: command not found", "docker compose: command not found", "docker: unknown command"],
            ),
            "recommended_actions": [
                "Check whether the host supports docker compose or docker-compose and update the pipeline accordingly.",
                "Install the missing Docker Compose binary/plugin on the Jenkins agent.",
                "Add a tool validation step before deployment stages.",
            ],
            "confidence": "high",
        }

    if (
        "pull access denied" in text
        or "requested access to the resource is denied" in text
        or "unauthorized" in text
        or ("authentication failed" in text and source_kind == "jenkins")
    ):
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "Registry or remote-service authentication failed during image pull/push or source access.",
                "score": 0.9,
            },
            {
                "cause": "The Jenkins credential ID is wrong, missing, or mapped to expired credentials.",
                "score": 0.72,
            },
            {
                "cause": "The target repository exists but the configured account lacks the required permissions.",
                "score": 0.51,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(
                evidence_lines,
                ["pull access denied", "requested access to the resource is denied", "unauthorized", "authentication failed"],
            ),
            "recommended_actions": [
                "Verify Jenkins credentials and credential IDs used in the pipeline.",
                "Confirm the target registry/repository permissions for the configured account.",
                "Retry login manually from the agent to validate access.",
            ],
            "confidence": "high",
        }

    if "no space left on device" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "The host ran out of disk space during build or deployment.",
                "score": 0.95,
            },
            {
                "cause": "Old Docker images, workspaces, or build cache consumed the available storage.",
                "score": 0.77,
            },
            {
                "cause": "Log growth or artifact retention filled the host volume over time.",
                "score": 0.49,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["no space left on device"]),
            "recommended_actions": [
                "Remove unused Docker images, containers, build cache, and old workspaces.",
                "Check disk usage on the Jenkins and deployment hosts.",
                "Add disk-usage monitoring and cleanup automation.",
            ],
            "confidence": "high",
        }

    if "connection refused" in text or "timed out" in text or "timeout" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "A dependent service was unreachable from the build or deployment environment.",
                "score": 0.79,
            },
            {
                "cause": "Firewall, security group, DNS, or network path configuration blocked access to the service.",
                "score": 0.61,
            },
            {
                "cause": "The dependency is up intermittently, causing transient connection failures.",
                "score": 0.38,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["connection refused", "timed out", "timeout"]),
            "recommended_actions": [
                "Verify the target service is running and reachable from the Jenkins or app host.",
                "Check DNS, firewall, security group, and exposed port configuration.",
                "Retry after confirming the dependent service health.",
            ],
            "confidence": "medium",
        }

    if "script returned exit code" in text:
        ranked_causes = _normalize_ranked_causes([
            {
                "cause": "A Jenkins shell step failed, but the exact failing command must be inferred from nearby log lines.",
                "score": 0.69,
            },
            {
                "cause": "A previous command in the same stage failed and propagated a non-zero exit code to Jenkins.",
                "score": 0.57,
            },
            {
                "cause": "The underlying failure belongs to Docker, Git, npm, Python, or deployment commands in the same stage.",
                "score": 0.48,
            },
        ])

        return {
            "likely_root_cause": ranked_causes[0]["cause"],
            "top_possible_causes": ranked_causes,
            "evidence": _top_evidence(evidence_lines, ["script returned exit code"]),
            "recommended_actions": [
                "Inspect the commands executed immediately before the exit code line.",
                "Capture the stderr lines from the same stage and include them in the evidence.",
                "Check whether the failure belongs to Docker, Git, npm, Python, or deployment commands.",
            ],
            "confidence": "medium",
        }

    return None


def _top_evidence(evidence_lines: List[str], keywords: List[str], limit: int = 3) -> List[str]:
    matches: List[str] = []
    lowered_keywords = [keyword.lower() for keyword in keywords]

    for line in evidence_lines:
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in lowered_keywords):
            matches.append(line.strip())
        if len(matches) >= limit:
            break

    return matches if matches else evidence_lines[:limit]


def _normalize_ranked_causes(causes: List[Dict], limit: int = 3) -> List[Dict]:
    normalized: List[Dict] = []

    for item in causes[:limit]:
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

        normalized.append({
            "cause": cause,
            "score": round(score, 2),
        })

    return normalized
