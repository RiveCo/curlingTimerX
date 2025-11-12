# First Release (v1.0.0) - Setup Complete

This document describes the first release setup for Curling Timer X.

## Status

✅ **Tag Created**: `v1.0.0` tag has been created locally  
✅ **QR Code Generated**: `curling-timer-qr.png` ready for distribution  
⏳ **Tag Push Pending**: Tag needs to be pushed to trigger release workflow  

## What Has Been Done

1. **Git Tag Created**: The `v1.0.0` tag has been created locally and points to the current commit
2. **QR Code Generated**: A QR code has been generated that points to the release download URL:
   - File: `curling-timer-qr.png`
   - URL: `https://github.com/RiveCo/curlingTimerX/releases/download/v1.0.0/curling-timer-x-1.0.0.rabbit`
   - Size: 450x450 pixels
   - Format: PNG (1-bit grayscale)

## What Happens Next

When the `v1.0.0` tag is pushed to GitHub, it will automatically:

1. **Trigger GitHub Actions**: The `.github/workflows/release.yml` workflow will run
2. **Build the App**: The app will be built from `apps/app`
3. **Package**: The built app will be packaged as `curling-timer-x-1.0.0.rabbit`
4. **Create Release**: A GitHub release will be created with version v1.0.0
5. **Upload Assets**: The `.rabbit` package and checksums will be uploaded

## How to Push the Tag

### Option 1: Use the Helper Script (Recommended)

```bash
./push-tag.sh
```

This script will:
- Verify the tag exists locally
- Push the tag to origin
- Display status and next steps

### Option 2: Manual Push

```bash
git push origin v1.0.0
```

### Option 3: GitHub Actions Manual Dispatch

If tag pushing is not available:

1. Go to the GitHub Actions tab
2. Select "Create Release" workflow
3. Click "Run workflow"
4. Enter version: `1.0.0`
5. Click "Run workflow"

## After Release is Created

Once the GitHub Actions workflow completes:

1. **Verify Release**: Check https://github.com/RiveCo/curlingTimerX/releases/tag/v1.0.0
2. **Test Download**: Verify the `.rabbit` package can be downloaded
3. **Test QR Code**: Scan `curling-timer-qr.png` with a Rabbit R1 device to test installation
4. **Update Documentation**: If needed, update README.md with any additional release notes

## Files Generated

- `v1.0.0` - Git tag (local, pending push)
- `curling-timer-qr.png` - QR code for easy installation (gitignored, regenerate with `python generate-qr.py`)
- `push-tag.sh` - Helper script to push the tag (committed)
- `FIRST_RELEASE.md` - This documentation file (committed)

## Troubleshooting

### Tag Already Exists on Remote

If the tag already exists on the remote:

```bash
# Delete remote tag (if you have permissions)
git push origin :refs/tags/v1.0.0

# Delete local tag
git tag -d v1.0.0

# Recreate and push
git tag v1.0.0
git push origin v1.0.0
```

### Authentication Issues

If you get authentication errors when pushing:

1. Make sure you have push access to the repository
2. Check that your GitHub credentials are configured correctly
3. Try using SSH instead of HTTPS:
   ```bash
   git remote set-url origin git@github.com:RiveCo/curlingTimerX.git
   git push origin v1.0.0
   ```
4. Or use the GitHub Actions manual dispatch method instead

### Release Workflow Fails

If the GitHub Actions workflow fails:

1. Check the Actions tab for error details
2. Verify the `apps/app` directory builds successfully locally
3. Check that `package-rabbit.sh` runs without errors
4. Review the workflow logs for specific error messages

## Next Releases

For future releases:

```bash
# Create a new tag
git tag v1.0.1

# Push the tag
git push origin v1.0.1

# Generate new QR code
python generate-qr.py --version 1.0.1
```

---

**Created**: 2025-11-12  
**Tag**: v1.0.0  
**Status**: Pending tag push
