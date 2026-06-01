from src.liquor_restaurant_packet import build_liquor_restaurant_packet
from src.sample_data import SAMPLE_LIQUOR_RESTAURANT_QUOTE
from src.salesforce_intake import (
    answer_form_questions,
    load_fake_salesforce_record,
    load_liquor_restaurant_questions,
    salesforce_record_to_quote_text,
)


def test_liquor_restaurant_packet_maps_pdf_fields():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)

    assert packet["workflow_name"] == "PaperworkPro Liquor / Restaurant Quote Intake"
    assert packet["mapped_pdf_fields"]["01 Applicant name"] == "Harbor & Vine Kitchen LLC"
    assert packet["mapped_pdf_fields"]["AR Food"] == "850000"


def test_liquor_restaurant_packet_flags_underwriting_review_items():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)

    assert packet["requires_human_review"] is True
    assert any("Entertainment" in flag for flag in packet["risk_flags"])
    assert any("Late closing" in flag for flag in packet["risk_flags"])
    assert packet["submission_readiness"]["status"] == "ready_for_human_review"
    assert packet["submission_readiness"]["rep_double_checks"]


def test_fake_salesforce_record_answers_form_questions():
    record = load_fake_salesforce_record()
    questions = load_liquor_restaurant_questions()
    answers = answer_form_questions(record, questions)

    assert answers[0]["answer"] == "Harbor & Vine Kitchen LLC"
    assert answers[4]["answer"] == "850000"
    assert answers[0]["pdf_field"] == "01 Applicant name"
    assert all(answer["confidence"] == "high" for answer in answers)


def test_liquor_packet_accepts_fake_salesforce_source_record():
    record = load_fake_salesforce_record()
    quote_text = salesforce_record_to_quote_text(record)
    packet = build_liquor_restaurant_packet(quote_text, source_record=record)

    assert packet["intake_summary"]["applicant"] == "Harbor & Vine Kitchen LLC"
    assert packet["answered_form_questions"]


def test_liquor_packet_infers_application_answers_with_evidence():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)
    inferred = {item["id"]: item for item in packet["inferred_application_answers"]}

    assert inferred["entertainment_featured"]["inferred_answer"] == "Yes"
    assert "DJ" in inferred["entertainment_featured"]["evidence"]
    assert inferred["security_or_door_staff"]["inferred_answer"] == "Yes"
    assert inferred["losses_or_violations"]["inferred_answer"] == "No"
    assert inferred["entertainment_featured"]["flagged_for_review"] is True
    assert inferred["entertainment_featured"]["review_status"] == "verify_before_submission"


def test_liquor_packet_creates_csr_certificate_request():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)
    cert_request = packet["csr_certificate_request"]

    assert cert_request["requested"] is True
    assert cert_request["status"] == "ready_for_csr_review"
    assert cert_request["requires_csr_review"] is True
    assert any("Additional insured" in flag for flag in cert_request["review_flags"])
    assert "Please review the certificate request" in cert_request["csr_email_draft"]


def test_certificate_requirements_are_part_of_application_packet_and_quote_flags():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)

    cert_requirements = packet["application_packet"]["certificate_requirements"]
    assert cert_requirements["certificate_requested"] == "Yes"
    assert cert_requirements["additional_insured_requested"] == "Yes"
    assert any("Additional insured" in flag for flag in packet["risk_flags"])
    assert any("quote preparation" in item for item in packet["submission_readiness"]["rep_double_checks"])


def test_liquor_packet_includes_dashboard_ready_analytics_summary():
    packet = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)
    analytics = packet["analytics_summary"]

    assert 0 <= analytics["submission_readiness_score"] <= 100
    assert analytics["percent_fields_auto_inferred"] > 0
    assert analytics["percent_fields_needing_review"] > 0
    assert analytics["missing_information_count"] == len(packet["missing_information"])
    assert analytics["required_endorsements_count"] >= 3
    assert analytics["average_confidence_score"] > 0
    assert "certificate_endorsements" in analytics["risk_flags_by_category"]
    assert analytics["common_missing_fields"] == []
    assert analytics["dashboard_ready_json"]["review_status"] == "prepared_for_human_review"
    assert "does not approve" in analytics["dashboard_ready_json"]["human_review_note"]
