import re


def extract_requirements(text: str) -> dict:
    """Mock extraction layer.

    This is the LLM-ready boundary. In production, an LLM could help extract
    structured fields here, while the rules engine would remain deterministic.
    """
    lowered = text.lower()
    requirements = []

    keyword_requirements = {
        "soc 2": "SOC 2 mentioned",
        "data handling": "Data handling requirement mentioned",
        "indemnification": "Indemnification mentioned",
        "incident notice": "Incident notice requirement mentioned",
        "approval": "Approval requested",
        "expedited": "Expedited review requested",
    }

    for keyword, label in keyword_requirements.items():
        if keyword in lowered:
            requirements.append(label)

    effective_date = _extract_date_phrase(text)
    vendor_name = _extract_vendor_name(text)
    applicant_name = _extract_applicant_name(text)

    return {
        "vendor_name": vendor_name,
        "applicant_name": applicant_name,
        "effective_date": effective_date,
        "business_owner": None,
        "insurance_limits": None if "insurance limits were not included" in lowered else _extract_limits(text),
        "extracted_requirements": requirements,
        "raw_text": text,
    }


def _extract_date_phrase(text: str) -> str | None:
    match = re.search(r"\b(?:by|effective)\s+([A-Z][a-z]+\s+\d{1,2})\b", text)
    if match:
        return match.group(1)
    return None


def _extract_vendor_name(text: str) -> str | None:
    match = re.search(r"for\s+([A-Z][A-Za-z0-9&,\-\s]+?)(?:\.|\n|$)", text)
    if match:
        return match.group(1).strip()
    return None


def _extract_applicant_name(text: str) -> str | None:
    match = re.search(r"(?:applicant|insured|business):\s*([A-Z][A-Za-z0-9&,\-\s]+)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def _extract_limits(text: str) -> str | None:
    match = re.search(r"\$[\d,]+(?:\s*million|\s*M)?", text)
    if match:
        return match.group(0)
    return None
