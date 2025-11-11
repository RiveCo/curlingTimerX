# Quick Setup Guide for Rabbit R1

## Step 1: Enable GitHub Pages

1. Go to https://github.com/RiveCo/curlingTimerX/settings/pages
2. Under **"Build and deployment"**:
   - Set **Source** to **"GitHub Actions"**
3. Click Save

## Step 2: Merge This PR

Once this pull request is merged to the main branch, GitHub Actions will automatically:
- Build the app
- Deploy it to GitHub Pages
- Make it available at: `https://riveco.github.io/curlingTimerX/`

## Step 3: Generate QR Code

### Option A: Online (Easiest)
1. Go to https://www.qr-code-generator.com/
2. Paste: `https://riveco.github.io/curlingTimerX/`
3. Download the QR code image
4. Print or display it

### Option B: Use Python Script
```bash
pip install qrcode[pil]
python generate-qr.py
```

### Option C: Alternative QR Generators
- https://www.the-qrcode-generator.com/
- https://qr.io/
- https://goqr.me/

## Step 4: Scan with Rabbit R1

1. Open your Rabbit R1
2. Open the camera or QR scanner
3. Point it at the QR code
4. The Curling Timer app will open!

## Step 5: Bookmark (Optional)

After opening the app, bookmark it in your Rabbit R1 browser for quick access without the QR code.

## Updates

When you push changes to the main branch:
- The app automatically updates on GitHub Pages
- Just refresh the page on your Rabbit R1 to get updates
- No need to rescan or regenerate the QR code

## Troubleshooting

**Deployment failed?**
- Check the "Actions" tab in your GitHub repository
- Make sure GitHub Pages is set to "GitHub Actions" as the source

**Can't access the URL?**
- Wait 1-2 minutes after merging for deployment to complete
- Check the Actions tab to see if deployment succeeded

**QR code won't scan?**
- Ensure the QR code is large enough (at least 200x200px)
- Make sure there's good lighting
- Try the direct URL entry as backup

## Need Help?

Check the full README.md for detailed documentation and troubleshooting tips.
