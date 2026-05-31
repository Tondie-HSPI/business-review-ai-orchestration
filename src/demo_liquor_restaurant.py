import json
from pathlib import Path

from src.liquor_restaurant_packet import build_liquor_restaurant_packet
from src.sample_data import SAMPLE_LIQUOR_RESTAURANT_QUOTE


def main() -> None:
    output = build_liquor_restaurant_packet(SAMPLE_LIQUOR_RESTAURANT_QUOTE)
    print(json.dumps(output, indent=2))

    output_path = Path("outputs/sample_liquor_restaurant_packet.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
