# Code Projects Portfolio

This document provides a detailed analysis of Anon's code repositories, demonstrating technical skills across backend development, tooling, and personal projects.

---

## Backend Applications

### transit-pulse — Real-Time Transit Predictions
REST API serving real-time bus and train arrival predictions by combining GTFS static data with live GPS feeds.

- **Languages**: Go
- **Frameworks**: Gin, WebSocket
- **Tools**: PostgreSQL, Redis, Docker, GitHub Actions
- **Patterns**: Streaming WebSocket connections, GTFS data parsing, geospatial queries with PostGIS, rate limiting, health checks

Demonstrates Go backend development, real-time data streaming, and geospatial database operations.

### pantry-api — Recipe Management Platform
Full-stack recipe management app with ingredient tracking, meal planning, and grocery list generation.

- **Languages**: TypeScript, JavaScript
- **Frameworks**: Nuxt.js, Vue 3, FastAPI (Python backend)
- **Tools**: PostgreSQL, Drizzle ORM, Docker Compose, Vitest
- **Patterns**: Server-side rendering, REST API design, full-text search, responsive UI with Tailwind CSS

Demonstrates full-stack development with modern Vue ecosystem and Python backend integration.

---

## Developer Tools

### log-sprout — Structured Log Analyzer
CLI tool that parses structured JSON logs, applies filters, and outputs formatted summaries for debugging production issues.

- **Languages**: Rust
- **Tools**: serde, clap (CLI framework), tokio (async I/O)
- **Patterns**: Streaming file processing, configurable output formats (table, JSON, CSV), regex-based filtering

Demonstrates Rust systems programming and CLI tool design.

### seed-db — Database Fixture Generator
Python library for generating realistic test fixtures from database schemas with configurable relationships and constraints.

- **Languages**: Python
- **Tools**: SQLAlchemy, Faker, Click (CLI)
- **Patterns**: Schema introspection, foreign key graph traversal, deterministic seeding, pip-installable package

Demonstrates Python library design, database tooling, and open source packaging.

---

## Machine Learning

### tag-sort — Text Classification Pipeline
Fine-tuned DistilBERT model for categorizing support tickets by department, deployed as a FastAPI microservice.

- **Languages**: Python
- **Frameworks**: FastAPI, Hugging Face Transformers, PyTorch
- **Tools**: Docker, pytest, MLflow (experiment tracking)
- **Patterns**: Model fine-tuning, batch inference, confidence thresholds, A/B testing integration

Demonstrates ML model deployment, experiment tracking, and production API design.

---

## Hackathon & Side Projects

### PDX Transit Tracker — Hackathon Entry
48-hour hackathon project (PDX Tech Week 2023) — a transit prediction dashboard that won Best Backend Architecture.

- **Languages**: Go, JavaScript
- **Tools**: WebSocket, Leaflet.js, GTFS
- **Patterns**: Real-time map updates, backend streaming, rapid prototyping

---

## Overall Skills & Technologies Summary

### Languages
- **Go**: transit-pulse, PDX Transit Tracker
- **Python**: pantry-api (backend), seed-db, tag-sort
- **TypeScript/JavaScript**: pantry-api (frontend)
- **Rust**: log-sprout

### Frameworks & Libraries
- **Backend**: Gin, FastAPI, Django
- **Frontend**: Vue 3, Nuxt.js, Tailwind CSS
- **ML**: Hugging Face Transformers, PyTorch, scikit-learn
- **Database**: PostgreSQL, Redis, SQLAlchemy, Drizzle ORM

### Platforms & Infrastructure
- **Containerization**: Docker, Docker Compose, Kubernetes
- **CI/CD**: GitHub Actions, Jenkins
- **Monitoring**: MLflow, structured logging

### Domain Expertise
- **Backend Development**: REST API design, real-time streaming, event-driven architecture, data pipelines
- **Database Engineering**: Schema design, geospatial queries (PostGIS), full-text search, fixture generation
- **ML Engineering**: Model fine-tuning, batch inference, production deployment
- **DevOps**: Container orchestration, CI/CD pipelines, infrastructure as code
- **Testing**: Integration testing, automated QA, deterministic test data generation
