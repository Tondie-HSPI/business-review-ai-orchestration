# Evaluation Notes

This prototype can be evaluated with sample requests that vary by request type, missing information, risk language, and urgency.

## Suggested Evaluation Checks

- Does the workflow classify the request correctly?
- Are required fields detected as missing when absent?
- Are deterministic rules triggered consistently?
- Does the recommendation match the triggered rules?
- Are high-risk or ambiguous requests routed to human review?

## Current Limitations

- Extraction is keyword-based.
- The sample set is small.
- No database or review history is included yet.
- No production LLM integration is included.
