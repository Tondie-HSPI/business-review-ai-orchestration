from src.liquor_restaurant_packet import build_liquor_restaurant_packet
from src.sample_data import SAMPLE_LIQUOR_RESTAURANT_QUOTE


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
