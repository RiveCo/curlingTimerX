#!/usr/bin/env python3
"""
Generate a QR code for the Curling Timer X app.

This script creates a QR code that can be scanned on a Rabbit R1 device
to access or install the app.

IMPORTANT: Native app installation requires an official Rabbit "creation code"
from Rabbit's developer portal. Regular download URL QR codes will show
"Not a valid creation code" error on Rabbit R1 devices.

For immediate access, use --web-only flag to generate a web access QR code.

Requirements:
    pip install qrcode[pil]

Usage:
    # Generate QR for web access (RECOMMENDED - works now!)
    python generate-qr.py --web-only
    
    # Generate QR for installable app package (requires creation code)
    python generate-qr.py
    
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
    print()
    
    if is_web:
        print("✅ Mode: Web access (opens in browser)")
        print("   This QR code will work immediately on Rabbit R1!")
    else:
        print("⚠️  Mode: App installation (downloads .rabbit package)")
        print("   WARNING: This requires an official Rabbit 'creation code'")
        print("   Regular download URLs show 'Not a valid creation code' error")
        print()
        print("   For immediate access, use: python generate-qr.py --web-only")
        print("   For details, see: RABBIT_DEVELOPER_GUIDE.md")
    
    print()
    
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
    print()
    
    if is_web:
        print("📱 READY TO USE!")
        print("   Scan this QR code with your Rabbit R1 to open the app in browser!")
        print("   Full functionality available immediately.")
    else:
        print("⚠️  NOT READY FOR R1 INSTALLATION")
        print("   This QR code points to a download URL, not a creation code.")
        print("   It will show 'Not a valid creation code' error on Rabbit R1.")
        print()
        print("   To use the app now:")
        print("   1. Run: python generate-qr.py --web-only")
        print("   2. Scan the web QR code instead")
        print()
        print("   To get native installation working:")
        print("   - Register app in Rabbit's developer portal")
        print("   - Get official creation code after approval")
        print("   - See RABBIT_DEVELOPER_GUIDE.md for details")

def main():
    parser = argparse.ArgumentParser(
        description="Generate a QR code for the Curling Timer X app",
        epilog="""
IMPORTANT: Native installation requires an official Rabbit creation code.
For immediate access, use --web-only flag.

Examples:
  python generate-qr.py --web-only          # Recommended - works now!
  python generate-qr.py --version 1.0.0     # Download URL (needs creation code)
        """
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
        help="Generate QR for web access (RECOMMENDED - works immediately!)"
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output file name (default: {DEFAULT_OUTPUT})"
    )
    
    args = parser.parse_args()
    
    # Show creation code warning if not using web-only
    if not args.web_only and not args.url:
        print()
        print("=" * 70)
        print("⚠️  CREATION CODE REQUIREMENT")
        print("=" * 70)
        print("Native app installation on Rabbit R1 requires an official")
        print("'creation code' from Rabbit's developer portal.")
        print()
        print("Regular download URL QR codes will show:")
        print('  "Not a valid creation code" error')
        print()
        print("For immediate access, use web mode instead:")
        print("  python generate-qr.py --web-only")
        print()
        print("For details, see: RABBIT_DEVELOPER_GUIDE.md")
        print("=" * 70)
        print()
        
        response = input("Continue generating download URL QR? (y/N): ").strip().lower()
        if response not in ['y', 'yes']:
            print("\nCancelled. Use --web-only flag for immediate access.")
            return
        print()
    
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
