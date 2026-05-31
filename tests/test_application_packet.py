from src.application_packet import build_application_packet
from src.sample_data import SAMPLE_USLI_APPLICATION_NOTES


def test_application_packet_is_human_review_only():
    packet = build_application_packet(SAMPLE_USLI_APPLICATION_NOTES)

    assert packet["workflow_name"] == "PaperworkPro Application Prep"
    assert packet["requires_human_review"] is True
    assert "Not an official carrier form" in packet["official_form_status"]


def test_application_packet_tracks_missing_fields():
    packet = build_application_packet(SAMPLE_USLI_APPLICATION_NOTES)

    assert "loss_history" in packet["missing_information"]
    assert "prior_carrier" in packet["missing_information"]
    assert packet["field_completion_status"]["applicant_name"] == "complete"
