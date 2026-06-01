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

    return {
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
        },
        "inferred_application_answers": _inferred_application_answers(normalized),
        "mapped_pdf_fields": _mapped_pdf_fields(normalized),
        "answered_form_questions": (
            answer_form_questions(source_record, load_liquor_restaurant_questions())
            if source_record
            else []
        ),
        "missing_information": missing,
        "risk_flags": risk_flags,
        "recommended_next_action": _next_action(missing, risk_flags),
        "requires_human_review": True,
    }


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
    return {
        "id": answer_id,
        "question": question,
        "inferred_answer": inferred_answer,
        "evidence": evidence or "No direct evidence found in intake.",
        "rep_check": rep_check,
        "pdf_field": pdf_field,
        "confidence": "high" if evidence and inferred_answer != "Review Required" else "needs_review",
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

    return checks
