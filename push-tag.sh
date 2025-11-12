#!/usr/bin/env bash
# Helper script to push the v1.0.0 tag to trigger the release workflow
# This script should be run by someone with push access to the repository

set -e

TAG="v1.0.0"

echo "🏷️  Pushing tag $TAG to origin..."
echo ""
echo "This will trigger the GitHub Actions release workflow which will:"
echo "  1. Build the app"
echo "  2. Package it as a .rabbit file"
echo "  3. Create a GitHub release"
echo "  4. Upload the package and checksums"
echo ""

# Check if tag exists locally
if ! git tag | grep -q "^${TAG}$"; then
    echo "❌ Error: Tag $TAG does not exist locally"
    echo "   Create it first with: git tag $TAG"
    exit 1
fi

# Push the tag
git push origin "$TAG"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tag $TAG pushed successfully!"
    echo ""
    echo "🔄 GitHub Actions workflow should now be running."
    echo "   Check: https://github.com/RiveCo/curlingTimerX/actions"
    echo ""
    echo "📦 Once complete, the release will be available at:"
    echo "   https://github.com/RiveCo/curlingTimerX/releases/tag/$TAG"
    echo ""
    echo "📱 The QR code has already been generated: curling-timer-qr.png"
else
    echo ""
    echo "❌ Failed to push tag $TAG"
    echo "   Make sure you have push access to the repository"
    exit 1
fi
