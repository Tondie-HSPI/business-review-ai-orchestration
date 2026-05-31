def classify_document(text: str) -> str:
    """Classify the request using transparent keyword logic."""
    lowered = text.lower()

    if "vendor" in lowered and "onboarding" in lowered:
        return "vendor_onboarding_request"
    if "contract" in lowered or "clause" in lowered:
        return "contract_review_request"
    if "policy" in lowered:
        return "policy_review_request"
    if "approval" in lowered:
        return "approval_request"

    return "general_business_review"
