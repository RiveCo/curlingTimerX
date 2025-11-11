# Curling Timer X for Rabbit R1

A specialized curling timer application designed for the Rabbit R1 device with a 240x282 display.

## Features

- **Timer**: Precision timing from hog line to back line
- **Ice Speed Tracking**: Adjust and record ice speed conditions (1-10 scale)
- **Sweeping Recommendations**: Real-time guidance based on stone position and ice speed
- **Shot History**: Track your last shots with detailed metrics
- **Settings**: View ice speed history and average times

## Accessing on Rabbit R1

### Via QR Code

Once deployed, you can access this app on your Rabbit R1 device by scanning a QR code:

1. **Get your GitHub Pages URL**: After deployment, your app will be available at:
   ```
   https://riveco.github.io/curlingTimerX/
   ```

2. **Generate a QR Code**: Use any QR code generator to create a scannable code:
   - Online: [QR Code Generator](https://www.qr-code-generator.com/)
   - Command line: `qrencode -o qr.png "https://riveco.github.io/curlingTimerX/"`
   - Python: 
     ```python
     import qrcode
     qr = qrcode.QRCode(version=1, box_size=10, border=5)
     qr.add_data("https://riveco.github.io/curlingTimerX/")
     qr.make(fit=True)
     img = qr.make_image(fill_color="black", back_color="white")
     img.save("curling-timer-qr.png")
     ```

3. **Scan on Rabbit R1**: 
   - Open the camera or QR scanner on your Rabbit R1
   - Point it at the QR code
   - The app will open in your device's browser

### Direct URL Access

You can also manually enter the URL on your Rabbit R1:
```
https://riveco.github.io/curlingTimerX/
```

## Deployment

This app is automatically deployed to GitHub Pages when changes are pushed to the main/master branch.

### Setup GitHub Pages (First Time)

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Save the settings

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Build the Vite app
- Deploy to GitHub Pages
- Make it available at your GitHub Pages URL

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

## Metadata

App metadata for Rabbit R1:
- **Icon**: `metadata/icon.png` (128x128)
- **Screenshot**: `metadata/screenshot.jpg` (240x282)

## License

MIT
