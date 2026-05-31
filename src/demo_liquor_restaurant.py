import json
from pathlib import Path

from src.liquor_restaurant_packet import build_liquor_restaurant_packet
from src.salesforce_intake import load_fake_salesforce_record, salesforce_record_to_quote_text


def main() -> None:
    record = load_fake_salesforce_record()
    quote_text = salesforce_record_to_quote_text(record)
    output = build_liquor_restaurant_packet(quote_text, source_record=record)
    print(json.dumps(output, indent=2))

    output_path = Path("outputs/sample_liquor_restaurant_packet.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
