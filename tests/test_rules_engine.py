from src.extraction import extract_requirements
from src.orchestration import review_business_request
from src.rules_engine import evaluate_rules


def test_missing_fields_trigger_human_review():
    extracted = extract_requirements("Vendor onboarding request. Insurance limits were not included.")
    result = evaluate_rules(extracted)

    assert "insurance_limits" in result["missing_information"]
    assert result["requires_human_review"] is True


def test_security_and_legal_rules_trigger():
    extracted = extract_requirements("Contract mentions SOC 2, data handling, and indemnification.")
    result = evaluate_rules(extracted)

    assert "security_review_required" in result["rules_triggered"]
    assert "data_handling_review_required" in result["rules_triggered"]
    assert "legal_review_required" in result["rules_triggered"]


def test_review_output_contains_decision_fields():
    output = review_business_request("Vendor onboarding approval. Insurance limits were not included. Expedited.")

    assert "recommended_next_action" in output
    assert "requires_human_review" in output
    assert output["requires_human_review"] is True
