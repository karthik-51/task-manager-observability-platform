

# Task Manager AI Log Monitoring & Observability Platform

![AWS](https://img.shields.io/badge/AWS-EC2-orange)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Jenkins](https://img.shields.io/badge/Jenkins-CI/CD-red)
![OpenSearch](https://img.shields.io/badge/OpenSearch-Logging-green)
![Python](https://img.shields.io/badge/Python-AI%20Agent-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

# Table of Contents

* Project Overview
* Problem Statement
* Architecture Diagram
* System Components
* Features
* Technologies Used
* Repository Structure
* How the System Works
* AI Agent Workflow
* LLM Integration
* Environment Variables
* Setup and Installation
* Running the Project
* Testing the System
* AWS Deployment (Free Tier)
* Security Best Practices
* Future Improvements
* Summary

---

# Project Overview

This project is an **end-to-end AI-driven log monitoring and observability platform** designed for modern DevOps and cloud-native environments.

The system centralizes logs from:

* Docker containers
* Application services
* Jenkins CI/CD pipelines

It then uses a **Python-based AI monitoring agent** to:

* Continuously fetch recent logs
* Detect failures automatically
* Perform root-cause analysis
* Rank possible causes
* Send real-time alerts with suggested fixes

The goal of this project is to:

* Improve system reliability
* Reduce manual troubleshooting
* Automate incident detection
* Enable faster root-cause analysis

---

# Problem Statement

In production environments, logs are distributed across:

* Application services
* Containers
* CI/CD pipelines
* Infrastructure

When failures occur, engineers typically need to:

* Search logs manually
* Identify errors
* Diagnose root causes
* Notify stakeholders

This process is slow and inefficient.

This project solves that problem by building a:

**centralized AI-assisted monitoring platform**

that automatically detects failures and recommends fixes.

---

# Architecture Diagram

```mermaid
flowchart LR

Developer[Developer / GitHub]

subgraph EC2_1["EC2 Instance 1 — Jenkins Server"]
Jenkins[Jenkins CI/CD Pipeline]
end

subgraph EC2_2["EC2 Instance 2 — Application & Logging"]
Docker[Docker Containers\nTask Manager App]
FluentBit[Fluent Bit\nLog Collector]
OpenSearch[OpenSearch\nLog Storage]
Dashboards[OpenSearch Dashboards]
end

subgraph EC2_3["EC2 Instance 3 — AI Monitoring"]
Agent[Python AI Monitoring Agent]
LLM[LLM API\nGroq / OpenAI]
SMTP[Email Alert Service]
end

Developer --> Jenkins
Jenkins --> Docker
Docker --> FluentBit
FluentBit --> OpenSearch
OpenSearch --> Dashboards
Agent --> OpenSearch
Agent --> LLM
Agent --> SMTP
```

---

# System Components

## Jenkins EC2

Responsible for:

* Running CI/CD pipeline
* Building application
* Deploying Docker containers
* Generating pipeline logs

---

## Task Deploy EC2

Responsible for:

* Running Docker containers
* Running Fluent Bit
* Running OpenSearch
* Storing logs

---

## AI Agent EC2

Responsible for:

* Fetching logs from OpenSearch
* Detecting failures
* Performing root-cause analysis
* Calling LLM API
* Sending alerts

---

# Features

* Centralized logging
* Automated incident detection
* Real-time alerting
* Root-cause analysis
* Smart root-cause ranking
* AI-assisted failure investigation
* Incident grouping
* Alert cooldown logic
* CI/CD pipeline monitoring
* Secure credential handling
* LLM integration support

---

# Technologies Used

## Cloud

* AWS EC2
* Linux

## CI/CD

* Jenkins
* GitHub

## Containers

* Docker
* Docker Compose

## Logging

* Fluent Bit
* OpenSearch
* OpenSearch Dashboards

## Application

* Node.js
* Express.js
* React
* MongoDB

## AI / Monitoring

* Python
* Requests
* SMTP
* LLM API

---

# Repository Structure

```text
task-manager-observability-platform/
│
├── task-manager-app/
│   ├── backend/
│   ├── frontend/
│   ├── docker-compose.yml
│   └── Jenkinsfile
│
├── ai-agent/
│   ├── app.py
│   ├── analyzers/
│   ├── clients/
│   ├── config/
│   ├── services/
│   ├── utils/
│   └── requirements.txt
│
├── opensearch/
│   ├── docker-compose.yml
│   └── opensearch-config/
│
├── fluent-bit/
│   ├── fluent-bit.conf
│   └── parsers.conf
│
├── .gitignore
└── README.md
```

---

# How the System Works

1. Developer pushes code to GitHub
2. Jenkins pipeline builds application
3. Docker containers are deployed
4. Logs are generated
5. Fluent Bit collects logs
6. Logs are stored in OpenSearch
7. AI agent fetches recent logs
8. Incident is detected
9. Root cause is analyzed
10. Alert is sent

---

# AI Agent Workflow

Each monitoring cycle performs:

1. Check OpenSearch health
2. Fetch recent logs
3. Detect incidents
4. Group incidents
5. Extract evidence
6. Perform heuristic analysis
7. Call LLM if needed
8. Rank possible causes
9. Send alert
10. Store incident

---

# LLM Integration

The AI agent integrates with external LLM APIs.

Supported providers:

* Groq
* OpenAI
* Local LLM

The LLM is used only when:

* heuristics cannot determine root cause
* failure is complex
* additional reasoning is required

This ensures:

* Fast detection
* Low cost
* High reliability

---

# Environment Variables

## Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb://username:password@host:27017/db
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_EXPIRE=15m
REFRESH_EXPIRE=7d
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_app_password
```

---

## OpenSearch `.env`

```env
OPENSEARCH_INITIAL_ADMIN_PASSWORD=admin_password
```

---

## AI Agent `.env`

```env
OPENSEARCH_HOST=YOUR_OPENSEARCH_HOST
OPENSEARCH_PORT=9200
OPENSEARCH_USER=admin
OPENSEARCH_PASSWORD=YOUR_PASSWORD
OPENSEARCH_USE_SSL=true
OPENSEARCH_VERIFY_CERTS=false

OPENSEARCH_DOCKER_INDEX=task-deploy-docker-*
OPENSEARCH_JENKINS_INDEX=jenkins-logs-*
OPENSEARCH_INCIDENT_INDEX=ai-agent-incidents

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

ALERT_FROM=your_email@gmail.com
ALERT_TO=recipient1@gmail.com,recipient2@gmail.com

POLL_INTERVAL_SECONDS=60
LOG_FETCH_SIZE=100
LOG_LOOKBACK_MINUTES=5
ALERT_COOLDOWN_SECONDS=1800

GROQ_API_KEY=your_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT_SECONDS=30
```

---

# Setup and Installation

## Prerequisites

Install:

* Git
* Docker
* Docker Compose
* Python
* Node.js
* Jenkins

---

# Clone Repository

```bash
git clone https://github.com/karthik-51/task-manager-observability-platform.git

cd task-manager-observability-platform
```

---

# Install Task Manager

```bash
cd task-manager-app/backend

npm install
npm run dev
```

Frontend:

```bash
cd ../frontend

npm install
npm start
```

---

# Install OpenSearch

```bash
cd opensearch

docker compose up -d
```

Verify:

```bash
curl -k -u admin:password https://localhost:9200
```

---

# Install Fluent Bit

```bash
cd fluent-bit

docker compose up -d
```

---

# Install AI Agent

```bash
cd ai-agent

python3 -m venv venv

source venv/bin/activate

pip install -r requirements.txt
```

---

# Running the AI Agent

```bash
python app.py
```

Expected output:

```text
AI monitoring agent started
OpenSearch ping status: True
```

---

# Default Monitoring Configuration

Polling interval:
60 seconds

Log lookback window:
5 minutes

Log fetch size:
100 logs

Alert cooldown:
1800 seconds

---

# Testing the System

Trigger failures:

* Wrong database password
* Missing environment variable
* Jenkins build failure
* Docker container crash
* Invalid SMTP credentials

Expected:

* Incident detected
* Root cause analyzed
* Alert sent

---

# Example Root Cause Ranking

```json
{
  "top_possible_causes": [
    {
      "cause": "MongoDB password invalid",
      "score": 0.91
    },
    {
      "cause": "User lacks permissions",
      "score": 0.73
    },
    {
      "cause": "Network connectivity issue",
      "score": 0.28
    }
  ]
}
```

---

# AWS Deployment (Free Tier)

Recommended infrastructure:

* 3 EC2 instances

Instance type:

* t2.micro
* t3.micro
* t4g.micro

Configuration:

* 1 vCPU
* 1 GB RAM

Suitable for:

* Learning
* Portfolio projects
* DevOps interviews
* Proof of concept environments

---

# Security Best Practices

Never commit:

* `.env` files
* passwords
* API keys
* tokens
* private keys

Use:

* Environment variables
* Secrets manager
* Credential store

---

# Future Improvements

* Slack alerts
* Auto remediation
* Dashboard analytics
* Incident trends
* Kubernetes deployment
* Role-based alerts
* Predictive monitoring

---

# Summary

Developed an end-to-end AI-driven log monitoring and observability pipeline using Docker, Jenkins, Fluent Bit, and OpenSearch to centralize application and CI/CD logs; integrated a Python-based AI agent to automate failure detection, root-cause analysis, and real-time alerting with suggested fixes.
