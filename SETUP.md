# Quick Setup Guide for Rabbit R1

## ⚠️ Important: Creation Code Requirement

**Native app installation requires an official Rabbit "creation code"** from Rabbit's developer portal. If you see "Not a valid creation code" when scanning a QR code, this is expected.

**Current Recommendation: Use Web Access (Works Now!)**

For full details, see [RABBIT_DEVELOPER_GUIDE.md](RABBIT_DEVELOPER_GUIDE.md)

---

## 🚀 Getting Started (2 Steps!)

### Step 1: Generate QR Code for Web Access

```bash
# Install dependency (one time only)
pip install qrcode[pil]

# Generate QR code for web access (RECOMMENDED)
python generate-qr.py --web-only
```

This creates `curling-timer-qr.png` in your current directory.

### Step 2: Scan and Use!

1. Open your Rabbit R1
2. Open camera or QR scanner
3. Point at the QR code
4. App opens in browser - full functionality available!
5. Bookmark for easy future access

---

## 📱 Native Installation (Not Available Yet)

Native installation via QR code requires:
1. App registration in Rabbit's developer portal
2. App review and approval by Rabbit
3. Official creation code from Rabbit

**Status:** We're working on this. Use web access in the meantime!

<details>
<summary>🔮 Future Native Installation Steps</summary>

Once we have an official creation code:

```bash
# Generate QR for native installation
python generate-qr.py
```

Then scan with Rabbit R1 to install as a native app.

</details>

---

## 📋 Using the App

**Controls:**
- **Hold Side Button**: Start/stop timer
- **Scroll Wheel**: Adjust ice speed
- **Tap Screen**: Record shot

**Access Methods:**
- ✅ **Web Browser** (Works Now): Full functionality
- ⏳ **Native App** (Coming Soon): After developer approval

---

## ❓ Common Questions

### Why doesn't the QR code work for installation?

Rabbit R1 requires official "creation codes" from their developer portal for native app installation. Regular download URLs won't work. Use web access instead - it has full functionality!

### Can I use the app now?

Yes! Use web access:
```bash
python generate-qr.py --web-only
```

### When will native installation work?

After we:
1. Register with Rabbit's developer portal
2. Submit the app for review
3. Get approval and creation code

See [RABBIT_DEVELOPER_GUIDE.md](RABBIT_DEVELOPER_GUIDE.md) for details.

---

## 📖 More Information

- **Creation Codes**: [RABBIT_DEVELOPER_GUIDE.md](RABBIT_DEVELOPER_GUIDE.md)
- **Full Documentation**: [README.md](README.md)
- **Implementation**: [IMPLEMENTATION.md](IMPLEMENTATION.md)

---

## 🔄 Creating a New Release (For Developers)

### Method 1: Using Git Tags (Automatic)

```bash
# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will automatically:
- Build the app
- Create `.rabbit` package  
- Create GitHub release with downloadable assets

### Method 2: Manual Release

1. Build the app:
   ```bash
   cd apps/app
   npm install
   npm run build
   cd ../..
   ```

2. Package for Rabbit R1:
   ```bash
   ./package-rabbit.sh 1.0.1
   ```

3. Upload to GitHub Releases:
   - Go to **Releases** → **Create new release**
   - Tag: `v1.0.1`
   - Upload `release/curling-timer-x-1.0.1.rabbit`
   - Publish release

4. Generate QR code:
   ```bash
   python generate-qr.py --version 1.0.1
   ```

### Method 3: GitHub Actions UI

1. Go to **Actions** tab
2. Select **"Create Release"**
3. Click **"Run workflow"**
4. Enter version (e.g., `1.0.1`)
5. Click **"Run workflow"**

Wait 2-3 minutes for the release to be created automatically.

---

## 📦 What Gets Created

When you create a release, users get:

- `curling-timer-x-VERSION.rabbit` - Installable app package
- `curling-timer-x-VERSION.rabbit.sha256` - Security checksum
- `curling-timer-x-VERSION.rabbit.md5` - Alternative checksum

---

## 🔗 URLs to Remember

### For App Installation
```
https://github.com/RiveCo/curlingTimerX/releases/download/v1.0.0/curling-timer-x-1.0.0.rabbit
```

### For Web Access
```
https://riveco.github.io/curlingTimerX/
```

### Latest Release
```
https://github.com/RiveCo/curlingTimerX/releases/latest
```

---

## ⚙️ One-Time Setup (GitHub Pages)

To enable automatic web deployment:

1. Go to repository **Settings**
2. Click **Pages** in the left sidebar
3. Under **Build and deployment**:
   - Set **Source** to **"GitHub Actions"**
4. Save

Now every push to `main`/`master` auto-deploys to GitHub Pages!

---

## 🐛 Common Issues

### QR code won't scan?
- Make sure it's large enough (200x200px minimum)
- Ensure good lighting
- Try generating a larger QR: `python generate-qr.py` (default size works well)

### App won't install?
- Verify the release exists on GitHub
- Check URL points to `.rabbit` file
- Try web access method instead: `python generate-qr.py --web-only`

### Release workflow failed?
- Check **Actions** tab for error details
- Ensure GitHub Pages is configured
- Verify you pushed a tag (not just committed)

### Python script error?
```bash
# Install/reinstall dependencies
pip install --upgrade qrcode[pil]
```

---

## 📱 QR Code Examples

### For Installation (Recommended)
```bash
python generate-qr.py --version 1.0.0
```
This creates a QR that downloads and installs the app.

### For Web Access
```bash
python generate-qr.py --web-only
```
This creates a QR that opens the app in browser.

### Custom URL
```bash
python generate-qr.py --url "https://your-custom-url.com" --output custom-qr.png
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Generate install QR | `python generate-qr.py` |
| Generate web QR | `python generate-qr.py --web-only` |
| Create release | `git tag v1.0.1 && git push origin v1.0.1` |
| Package app | `./package-rabbit.sh 1.0.1` |
| Build app | `cd apps/app && npm run build` |

---

## 📖 More Documentation

- **Full README**: See `README.md` for comprehensive docs
- **Implementation**: See `IMPLEMENTATION.md` for technical details
- **Device Controls**: See `apps/app/src/lib/device-controls.md`

---

## ✅ Success Checklist

- [ ] Python and qrcode installed
- [ ] Generated QR code with `python generate-qr.py`
- [ ] Scanned QR with Rabbit R1
- [ ] App installed and working
- [ ] Tested timer functionality

**Need help?** See the [full README](README.md) or create an [Issue](https://github.com/RiveCo/curlingTimerX/issues).
