#!/usr/bin/env python3
"""
Generate a QR code for the Curling Timer X app.

This script creates a QR code that can be scanned on a Rabbit R1 device
to quickly access the app.

Requirements:
    pip install qrcode[pil]

Usage:
    python generate-qr.py
    python generate-qr.py --url https://your-custom-url.com
    python generate-qr.py --output my-qr.png
"""

import argparse
import sys

try:
    import qrcode
except ImportError:
    print("Error: qrcode library not found.")
    print("Install it with: pip install qrcode[pil]")
    sys.exit(1)

DEFAULT_URL = "https://riveco.github.io/curlingTimerX/"
DEFAULT_OUTPUT = "curling-timer-qr.png"

def generate_qr_code(url, output_file):
    """Generate a QR code for the given URL."""
    print(f"Generating QR code for: {url}")
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_file)
    
    print(f"✓ QR code saved to: {output_file}")
    print(f"\nScan this QR code with your Rabbit R1 to open the app!")

def main():
    parser = argparse.ArgumentParser(
        description="Generate a QR code for the Curling Timer X app"
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help=f"URL to encode in the QR code (default: {DEFAULT_URL})"
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output file name (default: {DEFAULT_OUTPUT})"
    )
    
    args = parser.parse_args()
    
    generate_qr_code(args.url, args.output)

if __name__ == "__main__":
    main()
