REQUIRED_FIELDS = [
    "insurance_limits",
    "business_owner",
    "effective_date",
]


def evaluate_rules(extracted: dict) -> dict:
    """Apply deterministic business rules to extracted fields."""
    missing_information = [
        field for field in REQUIRED_FIELDS if not extracted.get(field)
    ]

    rules_triggered = []
    requirements = extracted.get("extracted_requirements", [])
    raw_text = extracted.get("raw_text", "").lower()

    if "SOC 2 mentioned" in requirements:
        rules_triggered.append("security_review_required")
    if "Data handling requirement mentioned" in requirements:
        rules_triggered.append("data_handling_review_required")
    if "Indemnification mentioned" in requirements:
        rules_triggered.append("legal_review_required")
    if "Incident notice requirement mentioned" in requirements:
        rules_triggered.append("incident_notice_review_required")
    if "expedited" in raw_text or "urgent" in raw_text:
        rules_triggered.append("expedited_request")
    if "ambiguous" in raw_text or "to be determined" in raw_text or "tbd" in raw_text:
        rules_triggered.append("ambiguous_language")

    requires_human_review = bool(missing_information or rules_triggered)

    return {
        "missing_information": missing_information,
        "rules_triggered": rules_triggered,
        "requires_human_review": requires_human_review,
    }
