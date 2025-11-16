#!/usr/bin/env python3
"""
Generate a QR code from the Rabbit R1 metadata JSON file.

This script reads the rabbit-metadata.json file and generates a QR code
containing the JSON data that can be scanned on a Rabbit R1 device.

Requirements:
    pip install qrcode[pil]

Usage:
    python generate-rabbit-qr.py
    python generate-rabbit-qr.py --output my-qr.png
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import qrcode
except ImportError:
    print("Error: qrcode library not found.")
    print("Install it with: pip install qrcode[pil]")
    sys.exit(1)

DEFAULT_OUTPUT = "curling-timer-rabbit-qr.png"
METADATA_FILE = "rabbit-metadata.json"

def generate_qr_code(json_data, output_file):
    """Generate a QR code for the given JSON data."""
    print(f"Generating QR code from metadata...")
    print()
    print("Metadata content:")
    print(json.dumps(json_data, indent=2))
    print()
    
    # Convert JSON to string for QR code
    json_string = json.dumps(json_data)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(json_string)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_file)
    
    print(f"✓ QR code saved to: {output_file}")
    print()
    print("📱 READY TO USE!")
    print("   Scan this QR code with your Rabbit R1 to access the app!")
    print(f"   App URL: {json_data.get('url', 'N/A')}")
    print()

def main():
    parser = argparse.ArgumentParser(
        description="Generate a QR code from Rabbit R1 metadata",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output file name (default: {DEFAULT_OUTPUT})"
    )
    parser.add_argument(
        "--metadata",
        default=METADATA_FILE,
        help=f"Path to metadata JSON file (default: {METADATA_FILE})"
    )
    
    args = parser.parse_args()
    
    # Read metadata file
    metadata_path = Path(args.metadata)
    if not metadata_path.exists():
        print(f"Error: Metadata file not found: {args.metadata}")
        print(f"Expected location: {metadata_path.absolute()}")
        sys.exit(1)
    
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in metadata file: {e}")
        sys.exit(1)
    
    # Validate required fields
    required_fields = ['title', 'url', 'description']
    missing_fields = [field for field in required_fields if field not in metadata]
    if missing_fields:
        print(f"Error: Missing required fields in metadata: {', '.join(missing_fields)}")
        sys.exit(1)
    
    generate_qr_code(metadata, args.output)

if __name__ == "__main__":
    main()
