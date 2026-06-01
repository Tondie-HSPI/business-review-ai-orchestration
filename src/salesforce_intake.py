import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_fake_salesforce_record() -> dict:
    path = PROJECT_ROOT / "data" / "fake_salesforce_liquor_restaurant_account.json"
    return json.loads(path.read_text(encoding="utf-8"))


def load_liquor_restaurant_questions() -> list[dict]:
    path = PROJECT_ROOT / "data" / "liquor_restaurant_form_questions.json"
    return json.loads(path.read_text(encoding="utf-8"))


def salesforce_record_to_quote_text(record: dict) -> str:
    account = record["account"]
    location = record["location"]
    opportunity = record["opportunity"]
    risk = record["risk_profile"]
    certificate = record.get("certificate_request", {})

    coverages = ", ".join(opportunity["requested_coverages"])

    return f"""Quote request generated from fake Salesforce intake data.
Applicant: {account["name"]}
DBA: {account["dba"]}
Location address: {location["street"]}
City: {location["city"]}
State: {location["state"]}
Zip: {location["zip"]}
Email: {account["email"]}
Phone: {account["phone"]}
Coverage requested: {coverages}
Operations: {risk["operations"]}
Years experience: {risk["years_experience"]}
Business start year: {risk["business_start_year"]}
Food sales: {risk["food_sales"]}
Alcohol sales: {risk["alcohol_sales"]}
Catering sales: {risk["catering_sales"]}
GL limit: {opportunity["general_liability_limit"]}
Liquor limit: {opportunity["liquor_liability_limit"]}
Close time: {risk["close_time"]}
Alcohol sales cease: {risk["alcohol_sales_cease"]}
Entertainment: {risk["entertainment"]}
Security: {risk["security"]}
BYOB: {risk["byob"]}
Claims or violations: {risk["claims_or_violations"]}
Liquor training: {risk["liquor_training"]}
ID scanner: {risk["id_scanner"]}
Happy hour after 9pm: {risk["happy_hour_after_9pm"]}
Lowest beer price: {risk["lowest_beer_price"]}
Lowest wine/liquor price: {risk["lowest_wine_liquor_price"]}
Building owner: {risk["building_owner"]}
Fryers: {risk["fryers"]}
Fire suppression: {risk["fire_suppression"]}
Certificate requested: {certificate.get("certificate_requested", "")}
Certificate holder: {certificate.get("certificate_holder", "")}
Certificate holder address: {certificate.get("certificate_holder_address", "")}
Certificate holder email: {certificate.get("certificate_holder_email", "")}
Certificate purpose: {certificate.get("certificate_purpose", "")}
Additional insured requested: {certificate.get("additional_insured_requested", "")}
Waiver of subrogation requested: {certificate.get("waiver_of_subrogation_requested", "")}
Primary and noncontributory requested: {certificate.get("primary_and_noncontributory_requested", "")}
Special certificate wording: {certificate.get("special_certificate_wording", "")}
"""


def answer_form_questions(record: dict, questions: list[dict]) -> list[dict]:
    answers = []

    for question in questions:
        answer = _lookup_path(record, question["source_field"])
        if isinstance(answer, list):
            answer = ", ".join(answer)
        elif answer is not None:
            answer = str(answer)

        answers.append(
            {
                "id": question["id"],
                "question": question["question"],
                "answer": answer,
                "source_field": question["source_field"],
                "pdf_field": question["pdf_field"],
                "confidence": "high" if answer not in (None, "") else "missing",
            }
        )

    return answers


def _lookup_path(record: dict, dotted_path: str):
    current = record
    for part in dotted_path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current
