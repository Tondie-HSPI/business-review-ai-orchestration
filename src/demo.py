import json
from pathlib import Path

from src.orchestration import review_business_request
from src.sample_data import SAMPLE_BUSINESS_REQUEST


def main() -> None:
    output = review_business_request(SAMPLE_BUSINESS_REQUEST)
    print(json.dumps(output, indent=2))

    output_path = Path("outputs/sample_review_output.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
