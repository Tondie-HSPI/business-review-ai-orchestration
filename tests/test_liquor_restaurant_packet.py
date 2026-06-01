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
