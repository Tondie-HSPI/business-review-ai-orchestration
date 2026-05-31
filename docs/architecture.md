# Architecture

This prototype uses a role-aware workflow instead of a generic chatbot pattern.

## Roles

- Intake Classifier: identifies the type of business request.
- Extraction Layer: converts unstructured text into structured fields.
- Application Packet Mapper: organizes insurance application notes into review-ready sections.
- Rules Engine: applies deterministic business rules.
- Risk Flag Generator: converts triggered rules into review-facing concerns.
- Human Review Gate: decides whether the request can continue or needs review.
- Output Formatter: returns a structured result for downstream systems.

## Design Boundary

The extraction layer is the only step that is LLM-ready. Rules, escalation, missing information checks, application field completion, and review requirements are deterministic so the workflow remains auditable.

## Application Prep Boundary

The USLI-style sample is not an official carrier form and does not submit anything. It demonstrates how a workflow can prepare a structured packet for human review before any carrier-facing action.
