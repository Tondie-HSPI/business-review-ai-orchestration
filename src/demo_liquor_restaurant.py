import json
from pathlib import Path

from src.liquor_restaurant_packet import build_liquor_restaurant_packet
from src.crm_intake import crm_record_to_quote_text, load_synthetic_crm_record


def main() -> None:
    record = load_synthetic_crm_record()
    quote_text = crm_record_to_quote_text(record)
    output = build_liquor_restaurant_packet(quote_text, source_record=record)
    print(json.dumps(output, indent=2))

    output_path = Path("outputs/sample_liquor_restaurant_packet.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
