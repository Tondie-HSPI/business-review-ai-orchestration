from src.extraction import extract_requirements
from src.rules_engine import evaluate_rules


APPLICATION_FIELDS = {
    "applicant_name": "Applicant / insured name",
    "effective_date": "Requested effective date",
    "insurance_limits": "Requested limits",
    "business_owner": "Internal business owner",
    "operations_description": "Business operations description",
    "loss_history": "Loss history",
    "prior_carrier": "Prior carrier",
}


def build_application_packet(text: str) -> dict:
    """Prepare a public-safe insurance application review packet.

    This intentionally avoids copying any official carrier application. It models
    how notes could be organized before a licensed/human reviewer completes or
    submits carrier paperwork.
    """
    extracted = extract_requirements(text)
    supplemental = _extract_application_details(text)
    combined = {**extracted, **supplemental}
    rule_result = evaluate_rules(combined)

    missing_fields = _missing_application_fields(combined)
    review_notes = _review_notes(text, rule_result, missing_fields)

    return {
        "workflow_name": "SubmissionReady AI Application Prep",
        "carrier_context": "Generic carrier-neutral application preparation",
        "official_form_status": "Not an official carrier form; human review required before use.",
        "application_sections": {
            "applicant_information": {
                "applicant_name": combined.get("applicant_name"),
                "operations_description": combined.get("operations_description"),
                "effective_date": combined.get("effective_date"),
            },
            "coverage_request": {
                "requested_limits": combined.get("insurance_limits"),
                "prior_carrier": combined.get("prior_carrier"),
            },
            "underwriting_review": {
                "loss_history": combined.get("loss_history"),
                "extracted_requirements": combined.get("extracted_requirements", []),
            },
        },
        "missing_information": missing_fields,
        "field_completion_status": _field_completion_status(combined),
        "review_notes": review_notes,
        "recommended_next_action": _application_next_action(missing_fields),
        "requires_human_review": True,
    }


def _extract_application_details(text: str) -> dict:
    lowered = text.lower()

    return {
        "applicant_name": _line_value(text, "applicant"),
        "effective_date": _line_value(text, "requested effective date") or _line_value(text, "effective date"),
        "operations_description": _line_value(text, "operations"),
        "loss_history": _line_value(text, "loss history"),
        "prior_carrier": _line_value(text, "prior carrier"),
        "business_owner": _line_value(text, "business owner"),
        "insurance_limits": (
            "$1,000,000/$2,000,000"
            if "1m/2m" in lowered or "$1m/$2m" in lowered
            else _line_value(text, "requested limits")
        ),
    }


def _line_value(text: str, label: str) -> str | None:
    prefix = f"{label}:"
    for line in text.splitlines():
        if line.lower().startswith(prefix):
            return line.split(":", 1)[1].strip() or None
    return None


def _missing_application_fields(fields: dict) -> list[str]:
    return [
        field_name
        for field_name in APPLICATION_FIELDS
        if not fields.get(field_name)
    ]


def _field_completion_status(fields: dict) -> dict:
    return {
        field_name: "complete" if fields.get(field_name) else "missing"
        for field_name in APPLICATION_FIELDS
    }


def _review_notes(text: str, rule_result: dict, missing_fields: list[str]) -> list[str]:
    notes = [
        "Do not submit to carrier without licensed/human review.",
        "Confirm all applicant-provided facts before completing final paperwork.",
    ]

    if "carrier" in text.lower() or "application" in text.lower():
        notes.append("Carrier context mentioned; verify current carrier form requirements.")
    if missing_fields:
        notes.append("Application packet is incomplete and needs follow-up.")
    if rule_result.get("rules_triggered"):
        notes.append("Review rules were triggered and should be resolved before approval.")

    return notes


def _application_next_action(missing_fields: list[str]) -> str:
    if missing_fields:
        readable_fields = ", ".join(field.replace("_", " ") for field in missing_fields)
        return f"Request missing application information before carrier submission: {readable_fields}."

    return "Send completed packet to human reviewer for final validation before carrier submission."
