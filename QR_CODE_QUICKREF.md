# QR Code Quick Reference

## 🚀 Quick Start

Generate a QR code for your Rabbit R1 in 3 steps:

```bash
pip install qrcode[pil]
python3 generate-rabbit-qr.py
# Scan curling-timer-rabbit-qr.png with your Rabbit R1!
```

## 📋 What's in the QR Code?

The QR code contains this JSON metadata:

| Field | Value |
|-------|-------|
| **Title** | Curling Timer X |
| **URL** | https://riveco.github.io/curlingTimerX/ |
| **Description** | A specialized curling timer application... |
| **Author** | RiveCo |
| **Theme Color** | #667eea |
| **Icon URL** | GitHub: metadata/icon.png |
| **Screenshot URL** | GitHub: metadata/screenshot.jpg |

## 🛠️ Generation Methods

### Method 1: Command Line (Fastest)
```bash
python3 generate-rabbit-qr.py
```

### Method 2: Web UI (Easiest)
```bash
# Open in browser
open qr-generator.html
```

### Method 3: Automated (For Releases)
```bash
# Create a release tag
git tag v1.0.2
git push origin v1.0.2
# QR code auto-generated and uploaded to release!
```

## 🎨 Customization

Edit `rabbit-metadata.json`:
```json
{
  "title": "Your Title",
  "url": "https://your-url.com",
  "description": "Your description",
  "themeColor": "#yourcolor"
}
```

Then regenerate:
```bash
python3 generate-rabbit-qr.py
```

## 📱 Usage

1. **Generate** QR code using any method above
2. **Display** on screen or print
3. **Scan** with Rabbit R1 camera
4. **Access** app instantly in browser

## 🔗 Resources

- Full Guide: [QR_CODE_GUIDE.md](QR_CODE_GUIDE.md)
- Main Docs: [README.md](README.md)
- Rabbit Guide: [RABBIT_DEVELOPER_GUIDE.md](RABBIT_DEVELOPER_GUIDE.md)

## 💡 Tips

- QR codes are **automatically generated** during GitHub releases
- Use **Rabbit R1 Metadata (JSON)** mode for best results
- The URL points to **GitHub Pages**, not Netlify
- Format matches the **R1 Workout Tracker** example

---

**Need help?** See the full [QR Code Guide](QR_CODE_GUIDE.md) for troubleshooting and advanced usage.
