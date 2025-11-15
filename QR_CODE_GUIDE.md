# Rabbit R1 QR Code Generation

This repository includes multiple ways to generate QR codes for accessing the Curling Timer X app on Rabbit R1 devices.

## Quick Start

The easiest way to generate a QR code with full Rabbit R1 metadata:

```bash
# Install dependencies (one time)
pip install qrcode[pil]

# Generate QR code
python3 generate-rabbit-qr.py
```

This will create `curling-timer-rabbit-qr.png` with a QR code containing the app metadata.

## QR Code Format

The QR code contains JSON metadata in the Rabbit R1 format:

```json
{
  "title": "Curling Timer X",
  "url": "https://riveco.github.io/curlingTimerX/",
  "description": "A specialized curling timer application...",
  "iconUrl": "https://raw.githubusercontent.com/RiveCo/curlingTimerX/main/metadata/icon.png",
  "themeColor": "#667eea",
  "author": "RiveCo",
  "screenshotUrl": "https://raw.githubusercontent.com/RiveCo/curlingTimerX/main/metadata/screenshot.jpg"
}
```

This format is compatible with Rabbit R1 devices and provides rich app information.

## Methods to Generate QR Codes

### 1. Python Script (Recommended)

Best for automation and consistent results:

```bash
# Generate with default settings
python3 generate-rabbit-qr.py

# Custom output file
python3 generate-rabbit-qr.py --output my-qr.png

# Custom metadata file
python3 generate-rabbit-qr.py --metadata custom-metadata.json
```

### 2. Web-Based Generator

For visual editing and customization:

1. Open `qr-generator.html` in your web browser
2. Select "Rabbit R1 Metadata (JSON)" mode
3. Fill in or modify the app details:
   - App Title
   - App URL (GitHub Pages)
   - Description
   - Author
   - Theme Color
   - Icon URL (optional)
   - Screenshot URL (optional)
4. Click "Generate QR Code"
5. Download the generated QR code

### 3. Automated Release Process

QR codes are automatically generated during GitHub releases:

1. Create a new release tag:
   ```bash
   git tag v1.0.2
   git push origin v1.0.2
   ```

2. GitHub Actions will:
   - Build the app
   - Package the .rabbit file
   - Generate the QR code
   - Upload all assets to the release

The QR code will be available as `curling-timer-rabbit-qr.png` in the release assets.

## Customizing the Metadata

Edit `rabbit-metadata.json` to customize the app information:

```json
{
  "title": "Your App Name",
  "url": "https://your-github-pages-url.com",
  "description": "Your app description",
  "iconUrl": "https://url-to-icon.png",
  "themeColor": "#yourcolor",
  "author": "Your Name",
  "screenshotUrl": "https://url-to-screenshot.jpg"
}
```

Then regenerate the QR code:

```bash
python3 generate-rabbit-qr.py
```

## Usage on Rabbit R1

1. **Generate** the QR code using any method above
2. **Display** the QR code on your screen or print it
3. **Scan** with your Rabbit R1 camera or QR scanner
4. **Access** the app - it will open in the Rabbit R1 browser

## Troubleshooting

**QR code won't scan?**
- Ensure the image is at least 200x200 pixels
- Check for good contrast
- Scan in good lighting
- Hold the R1 steady

**Need to update the URL?**
- Edit `rabbit-metadata.json`
- Run `python3 generate-rabbit-qr.py`

**Want a simple URL QR code instead?**
- Use the legacy script: `python generate-qr.py --web-only`
- Or use `qr-generator.html` in "Simple URL" mode

## Files

- `rabbit-metadata.json` - App metadata in Rabbit R1 format
- `generate-rabbit-qr.py` - Python script to generate QR codes
- `qr-generator.html` - Web-based QR code generator
- `generate-qr.py` - Legacy QR code generator (simple URLs)

## Related Documentation

- [README.md](README.md) - Main project documentation
- [RABBIT_DEVELOPER_GUIDE.md](RABBIT_DEVELOPER_GUIDE.md) - Rabbit R1 development guide
- [SETUP.md](SETUP.md) - Quick setup guide
