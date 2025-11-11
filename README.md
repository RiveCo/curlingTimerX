# Curling Timer X for Rabbit R1

A specialized curling timer application designed for the Rabbit R1 device with a 240x282 display.

## Features

- **Timer**: Precision timing from hog line to back line
- **Ice Speed Tracking**: Adjust and record ice speed conditions (1-10 scale)
- **Sweeping Recommendations**: Real-time guidance based on stone position and ice speed
- **Shot History**: Track your last shots with detailed metrics
- **Settings**: View ice speed history and average times

## Accessing on Rabbit R1

### Quick Setup

Once deployed, your app will be available at:
```
https://riveco.github.io/curlingTimerX/
```

### Three Ways to Access on Rabbit R1

#### Option 1: Generate QR Code Online (Easiest)
1. Visit [QR Code Generator](https://www.qr-code-generator.com/)
2. Paste your GitHub Pages URL: `https://riveco.github.io/curlingTimerX/`
3. Download the QR code
4. Scan it with your Rabbit R1's camera

#### Option 2: Use Python Script
```bash
# Install dependency
pip install qrcode[pil]

# Generate QR code
python generate-qr.py

# Or with custom URL
python generate-qr.py --url https://riveco.github.io/curlingTimerX/
```

#### Option 3: Direct URL Access
Manually enter the URL in your Rabbit R1 browser:
```
https://riveco.github.io/curlingTimerX/
```
Then bookmark it for quick access!

## Deployment

### First-Time GitHub Pages Setup

Before the automatic deployment works, you need to enable GitHub Pages:

1. Go to your repository on GitHub: `https://github.com/RiveCo/curlingTimerX`
2. Click on **Settings** (top navigation)
3. Click on **Pages** in the left sidebar
4. Under **Build and deployment**:
   - **Source**: Select **"GitHub Actions"** (not "Deploy from a branch")
5. Click **Save** if prompted

That's it! Once this PR is merged to main/master, the workflow will automatically deploy your app.

### Automatic Deployment

This app is automatically deployed to GitHub Pages when changes are pushed to the main/master branch.

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Install dependencies
- Build the Vite app
- Deploy to GitHub Pages
- Make it available at `https://riveco.github.io/curlingTimerX/`

### Manual Deployment

To manually trigger a deployment:
1. Go to the "Actions" tab in your repository
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

## Development

### Prerequisites

- Node.js 20 or higher
- npm

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

The built files will be in `apps/app/dist/`

## Device Controls

The app integrates with Rabbit R1's native controls:
- **Side Button (Hold)**: Start/stop timer
- **Scroll Wheel**: Adjust ice speed
- **Screen Tap**: Record shot and reset

See `apps/app/src/lib/device-controls.md` for detailed API documentation.

## Updates

Once deployed via GitHub Pages:
- Any changes pushed to the main/master branch will automatically update the live app
- Users can refresh the page on their Rabbit R1 to get the latest version
- No need to rescan the QR code for updates

## Troubleshooting

### Deployment Not Working?

1. **Check GitHub Actions**: Go to the "Actions" tab in your repository to see if the workflow ran
2. **Verify Pages Settings**: Make sure "GitHub Actions" is selected as the source in Pages settings
3. **Branch Name**: The workflow runs on `main` or `master` branch - make sure your PR is merged to one of these
4. **Manual Trigger**: You can manually trigger the workflow from the Actions tab

### Can't Access the App?

1. **Wait for Deployment**: After merging, wait 1-2 minutes for the deployment to complete
2. **Check URL**: Make sure you're using `https://riveco.github.io/curlingTimerX/` (lowercase, exact spelling)
3. **Clear Cache**: Try opening in an incognito/private window on your Rabbit R1

### QR Code Not Scanning?

1. **Size**: Make sure the QR code is large enough (at least 200x200 pixels)
2. **Contrast**: Ensure good contrast between the QR code and background
3. **Lighting**: Scan in good lighting conditions
4. **Alternative**: Use direct URL entry as a fallback

## Metadata

App metadata for Rabbit R1:
- **Icon**: `metadata/icon.png` (128x128)
- **Screenshot**: `metadata/screenshot.jpg` (240x282)

## License

MIT
