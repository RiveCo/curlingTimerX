#!/usr/bin/env python3
"""
Generate a QR code for the Curling Timer X app.

This script creates a QR code that can be scanned on a Rabbit R1 device
to download and install the app.

By default, generates a QR code for the latest release package.
Use --web-only flag to generate a QR code for web access instead.

Requirements:
    pip install qrcode[pil]

Usage:
    # Generate QR for installable app package (default)
    python generate-qr.py
    
    # Generate QR for web access only
    python generate-qr.py --web-only
    
    # Generate QR for specific version
    python generate-qr.py --version 1.0.0
    
    # Custom URL
    python generate-qr.py --url https://your-custom-url.com
    
    # Custom output file
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

DEFAULT_URL = "https://github.com/RiveCo/curlingTimerX/releases/latest/download/curling-timer-x-1.0.0.rabbit"
DEFAULT_OUTPUT = "curling-timer-qr.png"
GITHUB_PAGES_URL = "https://riveco.github.io/curlingTimerX/"

def generate_qr_code(url, output_file, is_web=False):
    """Generate a QR code for the given URL."""
    print(f"Generating QR code for: {url}")
    
    if is_web:
        print("Mode: Web access (opens in browser)")
    else:
        print("Mode: App installation (downloads .rabbit package)")
    
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
    
    if is_web:
        print(f"\n📱 Scan this QR code with your Rabbit R1 to open the app in browser!")
    else:
        print(f"\n📦 Scan this QR code with your Rabbit R1 to download and install the app!")
        print(f"   The .rabbit package will be downloaded and installed automatically.")

def main():
    parser = argparse.ArgumentParser(
        description="Generate a QR code for the Curling Timer X app",
        epilog="By default, generates QR for app installation. Use --web-only for web access."
    )
    parser.add_argument(
        "--url",
        help="Custom URL to encode in the QR code"
    )
    parser.add_argument(
        "--version",
        default="1.0.0",
        help="Version number for release download (default: 1.0.0)"
    )
    parser.add_argument(
        "--web-only",
        action="store_true",
        help="Generate QR for web access instead of app installation"
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output file name (default: {DEFAULT_OUTPUT})"
    )
    
    args = parser.parse_args()
    
    # Determine URL
    if args.url:
        url = args.url
        is_web = False
    elif args.web_only:
        url = GITHUB_PAGES_URL
        is_web = True
    else:
        # Default: Generate URL for release download
        url = f"https://github.com/RiveCo/curlingTimerX/releases/download/v{args.version}/curling-timer-x-{args.version}.rabbit"
        is_web = False
    
    generate_qr_code(url, args.output, is_web)

if __name__ == "__main__":
    main()
