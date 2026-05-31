RISK_MESSAGES = {
    "security_review_required": "SOC 2 requirement requires security review",
    "data_handling_review_required": "Data handling language requires review",
    "legal_review_required": "Indemnification language requires legal review",
    "incident_notice_review_required": "Incident notice requirement requires review",
    "expedited_request": "Expedited approval requested",
    "ambiguous_language": "Ambiguous language requires human review",
}


def build_risk_flags(rule_result: dict) -> list[str]:
    flags = [
        RISK_MESSAGES[rule]
        for rule in rule_result.get("rules_triggered", [])
        if rule in RISK_MESSAGES
    ]

    for field in rule_result.get("missing_information", []):
        flags.append(f"{field.replace('_', ' ').title()} missing")

    return flags
