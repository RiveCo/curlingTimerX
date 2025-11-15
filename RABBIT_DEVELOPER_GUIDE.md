# Rabbit R1 Developer Guide

## Understanding Creation Codes

### What are Creation Codes?

**Creation codes** are special QR codes used by Rabbit R1 devices to install apps. They are **NOT** simple URLs pointing to download files. Instead, they are unique identifiers generated through Rabbit's developer platform that:

1. **Identify your app** - Link to your registered app in Rabbit's system
2. **Provide security** - Ensure only approved apps can be installed
3. **Enable tracking** - Allow Rabbit to monitor app installations
4. **Control distribution** - Rabbit maintains quality control over available apps

### Why Regular QR Codes Don't Work

If you generate a QR code pointing to a `.rabbit` file URL (like `https://github.com/.../*.rabbit`), the Rabbit R1 will scan it but display an error:

> ❌ "Not a valid creation code"

This is because:
- The R1 device expects a specific creation code format
- Creation codes are tied to apps registered in Rabbit's developer portal
- Random download URLs are not recognized as valid creation codes

## How to Get a Creation Code

### Step 1: Register as a Rabbit Developer

1. **Visit Rabbit Developer Portal**
   - URL: `https://developer.rabbit.tech/` (or similar - check Rabbit's official website)
   - Create a developer account if you don't have one
   - Agree to developer terms and conditions

2. **Set Up Developer Profile**
   - Complete your developer profile
   - Provide necessary identification/verification
   - Accept any required agreements

### Step 2: Submit Your App

1. **Create App Listing**
   - Log into the Rabbit Developer Portal
   - Click "Create New App" or "Submit App"
   - Fill in app details:
     - App name: "Curling Timer X"
     - Package ID: `com.riveco.curlingtimer`
     - Description, category, keywords
     - Screenshots and icon

2. **Upload Your .rabbit Package**
   - Upload the built `.rabbit` file from your releases
   - URL: `https://github.com/RiveCo/curlingTimerX/releases/download/v1.0.0/curling-timer-x-1.0.0.rabbit`
   - Or upload the file directly if the portal supports it

3. **Complete App Information**
   - Privacy policy (if required)
   - Support contact information
   - Age rating and content warnings
   - Required permissions explanation

### Step 3: App Review Process

1. **Submit for Review**
   - Click "Submit for Review" in the developer portal
   - Wait for Rabbit team to review your app
   - Review typically takes 1-7 business days

2. **Review Criteria**
   - App functionality works correctly
   - No malicious code or security issues
   - Appropriate content and category
   - Follows Rabbit R1 design guidelines
   - Manifest.json is properly formatted

3. **Address Feedback**
   - If rejected, review the feedback
   - Make necessary changes
   - Resubmit for review

### Step 4: Get Your Creation Code

Once your app is approved:

1. **Access Creation Code**
   - Log into Rabbit Developer Portal
   - Navigate to your app's dashboard
   - Find "Creation Code" or "Distribution" section
   - Download or copy your creation code

2. **Creation Code Format**
   - May be a unique string/ID (e.g., `rabbit://app/abc123def456`)
   - Or a special QR code image provided by Rabbit
   - This is what users will scan to install your app

3. **Distribute Your App**
   - Share the creation code QR code with users
   - Users scan it with their Rabbit R1
   - App installs automatically from Rabbit's servers

## Alternative: Developer/Beta Testing

Some platforms offer beta testing or developer mode:

### Developer Mode

Check if Rabbit R1 has a developer mode that allows sideloading:

1. **Enable Developer Mode**
   - Go to R1 Settings → About
   - Tap version number 7 times (common pattern)
   - Or look for "Developer Options"

2. **Enable Sideloading**
   - Look for "Unknown Sources" or "Allow Sideloading"
   - Enable this setting
   - Restart device if required

3. **Test Installation**
   - Try scanning your GitHub URL QR code again
   - If developer mode supports it, it may work

**Note:** This is speculative - check Rabbit's official documentation for actual developer mode features.

### Beta Testing Program

1. **Join Beta Program**
   - Check if Rabbit offers a beta testing program
   - Sign up for beta access
   - Get beta tester privileges

2. **Beta Distribution**
   - Beta testers may be able to install apps via URLs
   - Or Rabbit may provide beta creation codes
   - Distribute to testers for feedback

## Current State of This App

### What We Have ✅

- ✅ **Properly formatted .rabbit package** - ZIP file with correct structure
- ✅ **Valid manifest.json** - All required fields present
- ✅ **App icon and screenshots** - Correctly sized and formatted
- ✅ **Working app code** - Vite-built web app
- ✅ **GitHub releases** - Downloadable .rabbit files
- ✅ **QR codes for URLs** - Can generate QR codes pointing to downloads

### What We Need ❌

- ❌ **Rabbit Developer Portal account** - Must register
- ❌ **App submission** - Must submit app to Rabbit
- ❌ **App approval** - Must pass Rabbit's review process
- ❌ **Official creation code** - Must get from Rabbit after approval

### Temporary Workarounds

Until you get an official creation code:

#### Option 1: Web Access (Works Now!)

Users can access the app via web browser:

```bash
# Generate QR for web access
python generate-qr.py --web-only
```

- URL: `https://riveco.github.io/curlingTimerX/`
- Scans and opens in R1's browser
- No installation needed
- Full functionality available

**Advantages:**
- ✅ Works immediately without approval
- ✅ No creation code needed
- ✅ Automatic updates via GitHub Pages
- ✅ Same functionality as native app

**Disadvantages:**
- ❌ Not installed as a native app
- ❌ Must open via browser each time
- ❌ Can't use app launcher

#### Option 2: Wait for Developer Access

If Rabbit R1 has a developer mode or beta program:
- Enable developer mode on your R1
- Sideload the app directly
- Test locally before official submission

#### Option 3: Share Direct Download

While you wait for approval:
- Share the GitHub release URL
- Users with developer mode might be able to install
- Or use it for your own testing

## Next Steps

### For Users Trying to Install

**Current Status:** The app cannot be installed via native QR code yet because it needs Rabbit's approval.

**What to do:**
1. **Use web access** - Scan the web QR code instead:
   ```
   python generate-qr.py --web-only
   ```
   This will open the app in your R1's browser with full functionality.

2. **Bookmark it** - Save the web page for easy future access

3. **Wait for native app** - We're working on getting official approval

### For Developers

**To enable native installation:**

1. **Register with Rabbit**
   - [ ] Create developer account at Rabbit's developer portal
   - [ ] Complete developer profile verification

2. **Submit App**
   - [ ] Create app listing in developer portal
   - [ ] Upload curling-timer-x-1.0.0.rabbit package
   - [ ] Fill in all required app information
   - [ ] Submit for review

3. **Get Approved**
   - [ ] Wait for Rabbit team review
   - [ ] Address any feedback or issues
   - [ ] Get approval notification

4. **Get Creation Code**
   - [ ] Access creation code in developer portal
   - [ ] Download official QR code
   - [ ] Share with users for installation

5. **Update Documentation**
   - [ ] Add official creation code QR to README
   - [ ] Update installation instructions
   - [ ] Announce native app availability

## Finding Rabbit's Developer Portal

### Official Resources

Check these official Rabbit resources:

1. **Rabbit Website**
   - https://rabbit.tech/
   - Look for "Developers" or "Developer Portal" link

2. **Rabbit Documentation**
   - Check for developer documentation
   - Look for API documentation
   - Search for "app submission" or "creation code"

3. **Rabbit Community**
   - Official forums or Discord
   - Reddit: r/rabbit_tech or similar
   - Developer community channels

4. **Contact Rabbit**
   - Email: developer@rabbit.tech (or similar)
   - Support ticket: Request developer access
   - Social media: Twitter/X @rabbit_tech

### Research Steps

If the developer portal is not obvious:

1. **Google Search**
   ```
   "Rabbit R1 developer portal"
   "Rabbit R1 app submission"
   "Rabbit R1 creation code"
   "How to publish apps on Rabbit R1"
   ```

2. **Check Documentation**
   - Look for SDK documentation
   - API documentation
   - Developer guides

3. **Ask Community**
   - Post in Rabbit forums
   - Ask in developer communities
   - Contact Rabbit support

## Frequently Asked Questions

### Q: Why isn't my QR code working?

**A:** Rabbit R1 requires official "creation codes" generated through their developer portal. Regular URL QR codes won't work for app installation. Use the web access method instead: `python generate-qr.py --web-only`

### Q: Can I bypass the creation code requirement?

**A:** Not recommended and likely not possible. The R1's security model requires creation codes. However, web access works without any approval.

### Q: How long does app review take?

**A:** Typical app review processes take 1-7 business days, but this depends on Rabbit's specific process.

### Q: Is the .rabbit package format correct?

**A:** Yes! The package format, manifest, and structure are all correct. The only missing piece is the official creation code from Rabbit.

### Q: Can users install via web instead?

**A:** Yes! Users can access full functionality via web browser. Generate a web QR code with: `python generate-qr.py --web-only`

### Q: Do I need to repackage the app?

**A:** No, the current .rabbit package is properly formatted. You just need to submit it to Rabbit's developer portal.

### Q: What happens after approval?

**A:** After approval, Rabbit will provide an official creation code (QR code or string) that users can scan to install your app natively.

### Q: Can I distribute the .rabbit file directly?

**A:** Only if users have developer mode enabled or if Rabbit allows sideloading. Otherwise, you must use the official creation code.

## Summary

### The Issue
- ❌ QR codes with download URLs are not valid creation codes
- ❌ Rabbit R1 requires official creation codes for app installation

### The Solution
1. ✅ Register as a Rabbit developer
2. ✅ Submit your app to Rabbit's developer portal
3. ✅ Get approval from Rabbit team
4. ✅ Receive official creation code
5. ✅ Share creation code with users

### Temporary Solution
- ✅ **Use web access**: Users can access the app immediately via browser
- ✅ Command: `python generate-qr.py --web-only`
- ✅ Full functionality available without waiting for approval

---

**Need Help?** 
- Check Rabbit's official developer documentation
- Contact Rabbit developer support
- Post in Rabbit developer community
- Create an issue in this repository

**Updates:**
This guide will be updated once we locate Rabbit's developer portal and complete the submission process.
