# Curling Timer X for Rabbit R1

A specialized curling timer application designed for the Rabbit R1 device with a 240x282 display.

## 🎯 Quick Start - Installing on Rabbit R1

### Option 1: Install via QR Code (Recommended - Native App)

This method installs the app as a native package on your Rabbit R1.

1. **Generate a QR code** using one of these methods:

   **Using Python (Best):**
   ```bash
   # Install dependency (one time)
   pip install qrcode[pil]
   
   # Generate QR for version 1.0.0 (default)
   python generate-qr.py
   
   # Or specify a different version
   python generate-qr.py --version 1.0.1
   ```

   **Using Online Generator:**
   - Visit [QR Code Generator](https://www.qr-code-generator.com/)
   - Paste this URL:
     ```
     https://github.com/RiveCo/curlingTimerX/releases/download/v1.0.0/curling-timer-x-1.0.0.rabbit
     ```
   - Download the QR code

2. **Scan with Rabbit R1**
   - Open your Rabbit R1 camera or QR scanner
   - Point it at the QR code
   - The `.rabbit` package will download and install automatically

3. **Launch the app** from your Rabbit R1 home screen!

### Option 2: Web Access (Browser-Based)

Access the app through the web browser without installation:

1. **Generate QR for web access:**
   ```bash
   python generate-qr.py --web-only
   ```
   
   Or visit: [QR Code Generator](https://www.qr-code-generator.com/) and use:
   ```
   https://riveco.github.io/curlingTimerX/
   ```

2. **Scan with Rabbit R1** - opens in browser
3. **Bookmark** for quick future access

## 📦 What's the Difference?

| Method | Install Type | Updates | Offline | Performance |
|--------|-------------|---------|---------|-------------|
| **QR Code Install** | Native package | Manual (rescan QR) | Partially | Better |
| **Web Access** | Browser-based | Automatic | No | Good |

**Recommendation:** Use QR Code Install for the best experience. Use Web Access if you want automatic updates.

## 🚀 Features

- **Timer**: Precision timing from hog line to back line
- **Ice Speed Tracking**: Adjust and record ice speed conditions (1-10 scale)
- **Sweeping Recommendations**: Real-time guidance based on stone position and ice speed
- **Shot History**: Track your last shots with detailed metrics
- **Settings**: View ice speed history and average times

## 🎮 Device Controls

The app integrates with Rabbit R1's native controls:
- **Side Button (Hold)**: Start/stop timer
- **Scroll Wheel**: Adjust ice speed
- **Screen Tap**: Record shot and reset

See `apps/app/src/lib/device-controls.md` for detailed API documentation.

## 📱 Accessing App Versions

### Latest Release
Always get the latest version:
```
https://github.com/RiveCo/curlingTimerX/releases/latest
```

### Specific Version
Download a specific version (replace `1.0.0` with desired version):
```
https://github.com/RiveCo/curlingTimerX/releases/download/v1.0.0/curling-timer-x-1.0.0.rabbit
```

### Check for Updates
Visit the [Releases page](https://github.com/RiveCo/curlingTimerX/releases) to see all available versions.

## 🔧 For Developers

### Prerequisites
- Node.js 20 or higher
- npm
- Python 3 (for QR generation)

### Local Development
```bash
cd apps/app
npm install
npm run dev
```
The app will be available at `http://localhost:5173`

### Building
```bash
cd apps/app
npm run build
```
Built files will be in `apps/app/dist/`

### Creating a Release Package

Package the app for Rabbit R1 distribution:

```bash
# Build and package (version defaults to 1.0.0)
./package-rabbit.sh

# Or specify version
./package-rabbit.sh 1.0.1
```

This creates:
- `release/curling-timer-x-VERSION.rabbit` - The installable package
- `release/curling-timer-x-VERSION.rabbit.sha256` - SHA256 checksum
- `release/curling-timer-x-VERSION.rabbit.md5` - MD5 checksum

### Automated Releases via GitHub Actions

#### Method 1: Tag-Based Release (Recommended)
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
1. Build the app
2. Package it as a `.rabbit` bundle
3. Create a GitHub release
4. Upload the package and checksums

#### Method 2: Manual Workflow Dispatch
1. Go to **Actions** tab in GitHub
2. Select **"Create Release"** workflow
3. Click **"Run workflow"**
4. Enter the version number (e.g., `1.0.0`)
5. Click **"Run workflow"**

### Package Structure

The `.rabbit` package contains:
```
curling-timer-x-VERSION.rabbit/
├── manifest.json       # App metadata (name, version, permissions)
├── index.html          # Main app entry point
├── assets/             # JavaScript and CSS assets
│   ├── main-*.js
│   └── main-*.css
├── icon.png            # App icon (128x128)
├── screenshot.jpg      # App screenshot (240x282)
└── README.txt          # Installation instructions
```

### Manifest File

The `.rabbit/manifest.json` file contains app metadata:
```json
{
  "name": "Curling Timer X",
  "package": "com.riveco.curlingtimer",
  "version": "1.0.0",
  "description": "A specialized curling timer application...",
  "type": "web",
  "entry": "index.html",
  "display": {
    "width": 240,
    "height": 282,
    "orientation": "portrait"
  },
  "icons": {
    "128": "icon.png"
  },
  "permissions": ["storage"]
}
```

## 🌐 GitHub Pages Deployment

The app is also automatically deployed to GitHub Pages for web access.

### Setup (One-Time)
1. Go to **Settings** → **Pages**
2. Under **Build and deployment**:
   - Set **Source** to **"GitHub Actions"**
3. Save

### Automatic Deployment
When changes are pushed to `main` or `master` branch:
- GitHub Actions builds the app
- Deploys to: `https://riveco.github.io/curlingTimerX/`
- Available within 1-2 minutes

### Manual Deployment
1. Go to **Actions** tab
2. Select **"Deploy to GitHub Pages"**
3. Click **"Run workflow"**

## 🐛 Troubleshooting

### Installation Issues

**QR code scanning but nothing happens?**
- Ensure you're using the correct URL format (should end with `.rabbit`)
- Check that the release exists on GitHub
- Try the web access method as a fallback

**"File not found" or 404 error?**
- Verify the version number in the URL matches an existing release
- Check the [Releases page](https://github.com/RiveCo/curlingTimerX/releases)
- Use `latest` in the URL to always get the newest version

**Download starts but won't install?**
- Ensure your Rabbit R1 supports `.rabbit` packages
- Check if sideloading is enabled on your device
- Try reinstalling by clearing cache and rescanning

### Web Access Issues

**Can't access GitHub Pages URL?**
- Wait 1-2 minutes after deployment for changes to propagate
- Check the Actions tab to verify deployment succeeded
- Try accessing in incognito/private mode
- Clear your browser cache

**App loads but doesn't work properly?**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors
- Ensure JavaScript is enabled

### QR Code Issues

**QR code won't scan?**
- Ensure the QR code is large enough (at least 200x200 pixels)
- Check for good contrast (black on white background)
- Try scanning in better lighting conditions
- Hold the R1 steady and at appropriate distance

**Generated wrong QR code?**
```bash
# For app installation
python generate-qr.py --version 1.0.0

# For web access only
python generate-qr.py --web-only

# Custom URL
python generate-qr.py --url "https://your-custom-url.com"
```

### Build/Development Issues

**Build fails?**
```bash
# Clean install dependencies
cd apps/app
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Packaging script fails?**
```bash
# Ensure build exists first
cd apps/app && npm run build && cd ../..

# Then package
./package-rabbit.sh 1.0.0
```

**GitHub Actions workflow fails?**
- Check that GitHub Pages is enabled with "GitHub Actions" as source
- Verify Node.js 20 is compatible
- Check the Actions tab for detailed error logs

## 📚 Additional Documentation

- **Device Controls**: See `apps/app/src/lib/device-controls.md`
- **Flutter Channel API**: See `apps/app/src/lib/flutter-channel.md`
- **UI Design Guide**: See `apps/app/src/lib/ui-design.md`
- **Quick Setup**: See `SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION.md`

## 🔒 Security

- CodeQL security scanning enabled
- No credentials or secrets in code
- Checksums provided for package verification
- Uses official GitHub Actions only

## 📄 License

MIT

---

## 🆘 Need Help?

1. **Check the Troubleshooting section above**
2. **Review existing [Issues](https://github.com/RiveCo/curlingTimerX/issues)**
3. **Create a new Issue** with:
   - What you're trying to do
   - What's happening instead
   - Error messages (if any)
   - Screenshots (if applicable)
   - Your Rabbit R1 firmware version

## 🎯 Summary

**For Rabbit R1 Users:**
1. Run: `python generate-qr.py`
2. Scan the QR code
3. App installs automatically!

**For Web Access:**
1. Run: `python generate-qr.py --web-only`
2. Scan the QR code
3. App opens in browser!

**For Developers:**
1. Make changes
2. Push tag: `git tag v1.0.1 && git push origin v1.0.1`
3. GitHub automatically creates release
4. Users get updated `.rabbit` package!
