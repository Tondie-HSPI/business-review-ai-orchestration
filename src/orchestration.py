from src.extraction import extract_requirements
from src.intake import classify_document
from src.output_formatter import (
    confidence_level,
    draft_email,
    recommend_next_action,
    summarize_request,
)
from src.risk_flags import build_risk_flags
from src.rules_engine import evaluate_rules


def review_business_request(text: str) -> dict:
    document_type = classify_document(text)
    extracted = extract_requirements(text)
    rule_result = evaluate_rules(extracted)
    risk_flags = build_risk_flags(rule_result)

    return {
        "document_type": document_type,
        "summary": summarize_request(document_type, extracted),
        "extracted_requirements": extracted["extracted_requirements"],
        "missing_information": rule_result["missing_information"],
        "risk_flags": risk_flags,
        "recommended_next_action": recommend_next_action(rule_result),
        "email_draft": draft_email(rule_result),
        "confidence_level": confidence_level(rule_result),
        "requires_human_review": rule_result["requires_human_review"],
    }
