def summarize_request(document_type: str, extracted: dict) -> str:
    vendor = extracted.get("vendor_name") or "the requester"
    requirements = extracted.get("extracted_requirements", [])

    if requirements:
        requirement_text = ", ".join(requirements[:3]).lower()
        return f"{document_type.replace('_', ' ').title()} for {vendor} involving {requirement_text}."

    return f"{document_type.replace('_', ' ').title()} for {vendor} requiring business review."


def recommend_next_action(rule_result: dict) -> str:
    missing = rule_result.get("missing_information", [])

    if rule_result.get("requires_human_review"):
        if missing:
            missing_text = ", ".join(field.replace("_", " ") for field in missing)
            return f"Route to human reviewer before approval and request missing {missing_text}."
        return "Route to human reviewer before approval due to triggered review rules."

    return "Proceed with standard approval workflow."


def confidence_level(rule_result: dict) -> str:
    missing_count = len(rule_result.get("missing_information", []))
    rule_count = len(rule_result.get("rules_triggered", []))

    if missing_count >= 2 or rule_count >= 4:
        return "medium"
    if missing_count or rule_count:
        return "medium-high"
    return "high"


def draft_email(rule_result: dict) -> str:
    missing = rule_result.get("missing_information", [])

    if not missing:
        return "Thank you for the request. We have enough information to continue standard review."

    missing_text = ", ".join(field.replace("_", " ") for field in missing)
    return (
        "Thank you for the request. Before we can complete review, "
        f"please provide the following missing information: {missing_text}."
    )
