import json
from pathlib import Path

from src.application_packet import build_application_packet
from src.sample_data import SAMPLE_USLI_APPLICATION_NOTES


def main() -> None:
    output = build_application_packet(SAMPLE_USLI_APPLICATION_NOTES)
    print(json.dumps(output, indent=2))

    output_path = Path("outputs/sample_usli_application_packet.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
