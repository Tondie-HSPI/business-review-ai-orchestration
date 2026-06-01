from src.sample_data import SAMPLE_LIQUOR_RESTAURANT_QUOTE
from src.salesforce_intake import answer_form_questions, load_liquor_restaurant_questions


REQUIRED_INTAKE_FIELDS = [
    "applicant",
    "location_address",
    "city",
    "state",
    "zip",
    "email",
    "phone",
    "coverage_requested",
    "operations",
    "food_sales",
    "alcohol_sales",
    "gl_limit",
    "liquor_limit",
    "close_time",
    "alcohol_sales_cease",
    "claims_or_violations",
    "liquor_training",
    "id_scanner",
]


PDF_FIELD_MAP = {
    "applicant": "01 Applicant name",
    "location_address": "02 Location address",
    "city": "03 City",
    "state": "04 State",
    "zip": "05 Zip",
    "email": "07 email",
    "phone": "08 phone",
    "operations": "014 Description",
    "food_sales": "AR Food",
    "alcohol_sales": "AR Alc",
    "catering_sales": "AR Catering",
    "close_time": "11 hours",
    "lowest_beer_price": "59 lowest price",
    "lowest_wine_liquor_price": "60 lowest price",
}


def build_liquor_restaurant_packet(text: str = SAMPLE_LIQUOR_RESTAURANT_QUOTE, source_record: dict | None = None) -> dict:
    fields = _parse_key_values(text)
    normalized = _normalize_fields(fields)
    missing = [field for field in REQUIRED_INTAKE_FIELDS if not normalized.get(field)]
    risk_flags = _risk_flags(normalized)
    csr_certificate_request = _csr_certificate_request(normalized)
    inferred_answers = _inferred_application_answers(normalized)
    answered_questions = (
        answer_form_questions(source_record, load_liquor_restaurant_questions())
        if source_record
        else []
    )

    packet = {
        "workflow_name": "PaperworkPro Liquor / Restaurant Quote Intake",
        "risk_type": "restaurant_bar_liquor_liability",
        "official_form_status": "Draft intake support only; human review required before carrier submission.",
        "submission_readiness": {
            "status": "ready_for_human_review" if not missing else "needs_more_information",
            "carrier_agnostic": True,
            "blocking_missing_information_count": len(missing),
            "rep_double_checks": _rep_double_checks(normalized, risk_flags),
        },
        "intake_summary": {
            "applicant": normalized.get("applicant"),
            "location": _location_summary(normalized),
            "coverage_requested": normalized.get("coverage_requested"),
            "operations": normalized.get("operations"),
        },
        "application_packet": {
            "applicant_information": {
                "applicant": normalized.get("applicant"),
                "dba": normalized.get("dba"),
                "location_address": normalized.get("location_address"),
                "city": normalized.get("city"),
                "state": normalized.get("state"),
                "zip": normalized.get("zip"),
                "email": normalized.get("email"),
                "phone": normalized.get("phone"),
            },
            "sales_and_limits": {
                "food_sales": normalized.get("food_sales"),
                "alcohol_sales": normalized.get("alcohol_sales"),
                "catering_sales": normalized.get("catering_sales"),
                "gl_limit": normalized.get("gl_limit"),
                "liquor_limit": normalized.get("liquor_limit"),
            },
            "operations_and_controls": {
                "close_time": normalized.get("close_time"),
                "alcohol_sales_cease": normalized.get("alcohol_sales_cease"),
                "entertainment": normalized.get("entertainment"),
                "security": normalized.get("security"),
                "byob": normalized.get("byob"),
                "liquor_training": normalized.get("liquor_training"),
                "id_scanner": normalized.get("id_scanner"),
                "fire_suppression": normalized.get("fire_suppression"),
            },
            "certificate_requirements": {
                "certificate_requested": normalized.get("certificate_requested"),
                "certificate_holder": normalized.get("certificate_holder"),
                "certificate_purpose": normalized.get("certificate_purpose"),
                "additional_insured_requested": normalized.get("additional_insured_requested"),
                "waiver_of_subrogation_requested": normalized.get("waiver_requested"),
                "primary_and_noncontributory_requested": normalized.get("primary_noncontributory_requested"),
                "special_certificate_wording": normalized.get("special_certificate_wording"),
            },
        },
        "csr_certificate_request": csr_certificate_request,
        "inferred_application_answers": inferred_answers,
        "mapped_pdf_fields": _mapped_pdf_fields(normalized),
        "answered_form_questions": answered_questions,
        "missing_information": missing,
        "risk_flags": risk_flags,
        "recommended_next_action": _next_action(missing, risk_flags),
        "requires_human_review": True,
    }
    packet["analytics_summary"] = _analytics_summary(packet)
    return packet


def _parse_key_values(text: str) -> dict:
    parsed = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        parsed[key.strip().lower()] = value.strip() or None
    return parsed


def _normalize_fields(fields: dict) -> dict:
    aliases = {
        "applicant": "applicant",
        "dba": "dba",
        "location address": "location_address",
        "city": "city",
        "state": "state",
        "zip": "zip",
        "email": "email",
        "phone": "phone",
        "coverage requested": "coverage_requested",
        "operations": "operations",
        "years experience": "years_experience",
        "business start year": "business_start_year",
        "food sales": "food_sales",
        "alcohol sales": "alcohol_sales",
        "catering sales": "catering_sales",
        "gl limit": "gl_limit",
        "liquor limit": "liquor_limit",
        "close time": "close_time",
        "alcohol sales cease": "alcohol_sales_cease",
        "entertainment": "entertainment",
        "security": "security",
        "byob": "byob",
        "claims or violations": "claims_or_violations",
        "liquor training": "liquor_training",
        "id scanner": "id_scanner",
        "happy hour after 9pm": "happy_hour_after_9pm",
        "lowest beer price": "lowest_beer_price",
        "lowest wine/liquor price": "lowest_wine_liquor_price",
        "building owner": "building_owner",
        "fryers": "fryers",
        "fire suppression": "fire_suppression",
        "certificate requested": "certificate_requested",
        "certificate holder": "certificate_holder",
        "certificate holder address": "certificate_holder_address",
        "certificate holder email": "certificate_holder_email",
        "certificate purpose": "certificate_purpose",
        "additional insured requested": "additional_insured_requested",
        "waiver of subrogation requested": "waiver_requested",
        "primary and noncontributory requested": "primary_noncontributory_requested",
        "special certificate wording": "special_certificate_wording",
    }
    return {target: fields.get(source) for source, target in aliases.items()}


def _mapped_pdf_fields(fields: dict) -> dict:
    return {
        pdf_field: fields.get(intake_field)
        for intake_field, pdf_field in PDF_FIELD_MAP.items()
        if fields.get(intake_field)
    }


def _risk_flags(fields: dict) -> list[str]:
    flags = []
    entertainment = (fields.get("entertainment") or "").lower()
    security = (fields.get("security") or "").lower()
    close_time = (fields.get("close_time") or "").lower()
    alcohol_cease = (fields.get("alcohol_sales_cease") or "").lower()

    if "dj" in entertainment or "dancing" in entertainment or "band" in entertainment:
        flags.append("Entertainment or dancing should be reviewed for underwriting eligibility.")
    if "door" in security or "security" in security:
        flags.append("Security or door staff exposure should be reviewed.")
    if "a.m." in close_time or "am" in close_time:
        flags.append("Late closing time should be reviewed.")
    if "a.m." in alcohol_cease or "am" in alcohol_cease:
        flags.append("Late alcohol service cutoff should be reviewed.")
    claims_or_violations = (fields.get("claims_or_violations") or "").lower().strip(" .")
    if claims_or_violations not in {"none", "no", "none in the past five years"}:
        flags.append("Claims or liquor violations need detail before submission.")
    if (fields.get("liquor_training") or "").lower() != "yes":
        flags.append("Alcohol training should be confirmed.")
    if (fields.get("id_scanner") or "").lower() != "yes":
        flags.append("ID scanner control should be confirmed.")
    if (fields.get("fryers") or "").lower() == "yes" and not fields.get("fire_suppression"):
        flags.append("Fryer exposure requires fire suppression details.")
    if (fields.get("additional_insured_requested") or "").lower() == "yes":
        flags.append("Additional insured wording may affect quote terms or endorsements.")
    if (fields.get("waiver_requested") or "").lower() == "yes":
        flags.append("Waiver of subrogation may require endorsement availability review.")
    if (fields.get("primary_noncontributory_requested") or "").lower() == "yes":
        flags.append("Primary and noncontributory wording may require carrier approval.")

    return flags


def _location_summary(fields: dict) -> str:
    parts = [
        fields.get("location_address"),
        fields.get("city"),
        fields.get("state"),
        fields.get("zip"),
    ]
    return ", ".join(part for part in parts if part)


def _next_action(missing: list[str], risk_flags: list[str]) -> str:
    if missing:
        return "Request missing quote intake fields before preparing the application draft."
    if risk_flags:
        return "Prepare draft application field map and route flagged exposures to a human reviewer."
    return "Prepare draft application field map for human review."


def _inferred_application_answers(fields: dict) -> list[dict]:
    entertainment = fields.get("entertainment") or ""
    security = fields.get("security") or ""
    claims = (fields.get("claims_or_violations") or "").lower().strip(" .")
    fire_suppression = fields.get("fire_suppression") or ""
    operations = fields.get("operations") or ""

    return [
        _answer(
            "entertainment_featured",
            "Does the establishment feature entertainment?",
            "Yes" if _contains_any(entertainment, ["dj", "dancing", "band", "entertainment"]) else "No",
            entertainment,
            "Confirm entertainment type, frequency, and whether dancing is permitted.",
            "7 if yes",
        ),
        _answer(
            "security_or_door_staff",
            "Are bouncers, security, or door persons ever employed?",
            "Yes" if _contains_any(security, ["door", "security", "bouncer"]) else "No",
            security,
            "Confirm whether security is employee, contractor, or third-party service.",
            "12 R14",
        ),
        _answer(
            "losses_or_violations",
            "Any losses, claims, liquor citations, violations, charges, or enforcement actions in the past five years?",
            "No" if claims in {"none", "no", "none in the past five years"} else "Review Required",
            fields.get("claims_or_violations") or "",
            "Confirm loss runs and liquor violation history before submission.",
            "4 R1 / 21 / 22",
        ),
        _answer(
            "bar_with_seating",
            "Is there a bar with seating?",
            "Yes" if "bar seating" in operations.lower() else "Review Required",
            operations,
            "Confirm seating layout and whether bar seating is available to patrons.",
            "48 R60",
        ),
        _answer(
            "happy_hour_after_9pm",
            "Are drink specials or happy hours offered after 9 p.m.?",
            fields.get("happy_hour_after_9pm") or "Review Required",
            fields.get("happy_hour_after_9pm") or "",
            "Confirm all drink specials, happy hours, and promotional pricing.",
            "46 R58",
        ),
        _answer(
            "applicant_building_owner",
            "Is the applicant the building owner?",
            fields.get("building_owner") or "Review Required",
            fields.get("building_owner") or "",
            "Confirm ownership, lease terms, and maintenance responsibilities.",
            "16 R18",
        ),
        _answer(
            "fire_suppression",
            "If fryers are present, is a functioning fire extinguishing system in place?",
            "Yes" if fire_suppression else "Review Required",
            fire_suppression,
            "Confirm system type, cleaning contract, and service status.",
            "20a R23 / 28 R39",
        ),
    ]


def _answer(answer_id: str, question: str, inferred_answer: str, evidence: str, rep_check: str, pdf_field: str) -> dict:
    confidence = "high" if evidence and inferred_answer != "Review Required" else "needs_review"
    return {
        "id": answer_id,
        "question": question,
        "inferred_answer": inferred_answer,
        "evidence": evidence or "No direct evidence found in intake.",
        "rep_check": rep_check,
        "pdf_field": pdf_field,
        "confidence": confidence,
        "review_status": "verify_before_submission" if confidence == "high" else "rep_review_required",
        "flagged_for_review": True,
    }


def _contains_any(value: str, keywords: list[str]) -> bool:
    lowered = value.lower()
    return any(keyword in lowered for keyword in keywords)


def _rep_double_checks(fields: dict, risk_flags: list[str]) -> list[str]:
    checks = [
        "Confirm all applicant-provided facts before carrier submission.",
        "Confirm the selected carrier application version and state-specific requirements.",
        "Review inferred answers against source intake notes and producer guidance.",
    ]

    if risk_flags:
        checks.append("Review underwriting flags before sending the application packet.")
    if fields.get("entertainment"):
        checks.append("Confirm entertainment type, frequency, and whether dancing is permitted.")
    if fields.get("security"):
        checks.append("Confirm security or door staff duties and employment status.")
    if fields.get("fryers") == "Yes":
        checks.append("Confirm fire suppression system type, service status, and cleaning contract.")
    if (fields.get("certificate_requested") or "").lower() == "yes":
        checks.append("Review certificate wording requirements during quote preparation, not only after binding.")

    return checks


def _csr_certificate_request(fields: dict) -> dict:
    requested = (fields.get("certificate_requested") or "").lower() == "yes"
    missing = []
    if requested:
        for field in ["certificate_holder", "certificate_holder_address", "certificate_holder_email"]:
            if not fields.get(field):
                missing.append(field)

    review_flags = []
    if (fields.get("additional_insured_requested") or "").lower() == "yes":
        review_flags.append("Additional insured request needs policy/endorsement review.")
    if (fields.get("waiver_requested") or "").lower() == "yes":
        review_flags.append("Waiver of subrogation request needs endorsement review.")
    if (fields.get("primary_noncontributory_requested") or "").lower() == "yes":
        review_flags.append("Primary and noncontributory wording needs policy review.")
    if fields.get("special_certificate_wording"):
        review_flags.append("Special certificate wording should be reviewed before issuance.")

    return {
        "requested": requested,
        "status": "ready_for_csr_review" if requested and not missing else "not_requested" if not requested else "missing_information",
        "certificate_holder": {
            "name": fields.get("certificate_holder"),
            "address": fields.get("certificate_holder_address"),
            "email": fields.get("certificate_holder_email"),
        },
        "purpose": fields.get("certificate_purpose"),
        "requested_wording": {
            "additional_insured": fields.get("additional_insured_requested"),
            "waiver_of_subrogation": fields.get("waiver_requested"),
            "primary_and_noncontributory": fields.get("primary_noncontributory_requested"),
            "special_wording": fields.get("special_certificate_wording"),
        },
        "missing_information": missing,
        "review_flags": review_flags,
        "csr_email_draft": _csr_email_draft(fields, missing, review_flags) if requested else "",
        "requires_csr_review": requested,
    }


def _csr_email_draft(fields: dict, missing: list[str], review_flags: list[str]) -> str:
    if missing:
        return "Certificate request is missing required holder information before CSR processing."

    flags = "\n".join(f"- {flag}" for flag in review_flags) or "- No complex certificate wording detected."
    return (
        "Please review the certificate request below before issuance.\n\n"
        f"Insured: {fields.get('applicant')}\n"
        f"Certificate holder: {fields.get('certificate_holder')}\n"
        f"Holder address: {fields.get('certificate_holder_address')}\n"
        f"Delivery email: {fields.get('certificate_holder_email')}\n"
        f"Purpose: {fields.get('certificate_purpose')}\n\n"
        "Requested wording / review flags:\n"
        f"{flags}\n\n"
        "Please confirm policy permissions and endorsements before issuing."
    )


def _analytics_summary(packet: dict) -> dict:
    missing_information = [
        *packet["missing_information"],
        *packet["csr_certificate_request"]["missing_information"],
    ]
    risk_flags = [
        *packet["risk_flags"],
        *packet["csr_certificate_request"]["review_flags"],
    ]
    inferred_answers = packet["inferred_application_answers"]
    answered_questions = packet["answered_form_questions"]
    total_fields = len(REQUIRED_INTAKE_FIELDS) + len(inferred_answers)
    fields_needing_review = (
        len([answer for answer in inferred_answers if answer["flagged_for_review"] or answer["confidence"] == "needs_review"])
        + len(packet["missing_information"])
    )
    confidence_values = [
        *(answer["confidence"] for answer in inferred_answers),
        *(answer["confidence"] for answer in answered_questions),
    ]
    average_confidence = _average_confidence_score(confidence_values)
    metrics = {
        "submission_readiness_score": _clamp_score(
            100 - len(missing_information) * 8 - fields_needing_review * 4 - len(risk_flags) * 3 + round(average_confidence * 0.12)
        ),
        "percent_fields_auto_inferred": _percent(
            len([answer for answer in inferred_answers if answer["confidence"] == "high"]),
            total_fields,
        ),
        "percent_fields_needing_review": _percent(fields_needing_review, total_fields),
        "missing_information_count": len(missing_information),
        "required_endorsements_count": _required_endorsement_count(risk_flags),
        "average_confidence_score": average_confidence,
    }

    return {
        **metrics,
        "risk_flags_by_category": _risk_flags_by_category(risk_flags),
        "common_missing_fields": _common_missing_fields(missing_information),
        "dashboard_ready_json": {
            "workflow_name": packet["workflow_name"],
            "document_type": packet["risk_type"],
            "review_status": "needs_more_information_for_human_review"
            if missing_information
            else "prepared_for_human_review",
            "metrics": metrics,
            "human_review_note": (
                "This score supports document preparation and operations review only. "
                "It does not approve, reject, bind, issue, or submit anything."
            ),
        },
    }


def _average_confidence_score(values: list[str]) -> int:
    if not values:
        return 0
    score_map = {
        "high": 90,
        "medium-high": 90,
        "medium": 70,
        "needs_review": 55,
        "missing": 20,
    }
    return round(sum(score_map.get(value, 60) for value in values) / len(values))


def _risk_flags_by_category(flags: list[str]) -> dict:
    grouped = {}
    for flag in flags:
        category = _risk_category(flag)
        grouped.setdefault(category, []).append(flag)
    return grouped


def _risk_category(flag: str) -> str:
    lowered = flag.lower()
    if any(term in lowered for term in ["additional insured", "waiver", "primary"]):
        return "certificate_endorsements"
    if "missing" in lowered:
        return "missing_information"
    if any(term in lowered for term in ["entertainment", "security", "late"]):
        return "operations_review"
    if any(term in lowered for term in ["legal", "indemnification", "contract"]):
        return "legal_or_contract_review"
    if any(term in lowered for term in ["training", "scanner", "claims"]):
        return "controls_and_history"
    return "general_review"


def _required_endorsement_count(flags: list[str]) -> int:
    return len(
        [
            flag
            for flag in flags
            if any(term in flag.lower() for term in ["additional insured", "waiver", "primary"])
        ]
    )


def _common_missing_fields(fields: list[str]) -> list[dict]:
    counts = {}
    for field in fields:
        counts[field] = counts.get(field, 0) + 1
    return [
        {"field": field, "count": count}
        for field, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def _percent(part: int, whole: int) -> int:
    if not whole:
        return 0
    return round((part / whole) * 100)


def _clamp_score(value: int) -> int:
    return max(0, min(100, value))
