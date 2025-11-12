#!/usr/bin/env bash
# Package the Curling Timer X app for Rabbit R1 deployment
# This script creates a .rabbit bundle that can be installed via QR code

set -e

echo "🐰 Packaging Curling Timer X for Rabbit R1..."

# Configuration
APP_NAME="curling-timer-x"
VERSION="${1:-1.0.0}"
BUILD_DIR="apps/app/dist"
RABBIT_DIR=".rabbit"
OUTPUT_DIR="release"
PACKAGE_NAME="${APP_NAME}-${VERSION}.rabbit"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}⚠️  Build directory not found. Building app first...${NC}"
    cd apps/app
    npm ci
    npm run build
    cd ../..
fi

# Create output directory
echo -e "${BLUE}📁 Creating output directory...${NC}"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/package"

# Copy built app files
echo -e "${BLUE}📦 Copying built app files...${NC}"
cp -r "$BUILD_DIR"/* "$OUTPUT_DIR/package/"

# Copy manifest
echo -e "${BLUE}📋 Adding manifest...${NC}"
cp "$RABBIT_DIR/manifest.json" "$OUTPUT_DIR/package/"

# Copy icon and screenshots
echo -e "${BLUE}🎨 Adding app assets...${NC}"
cp "$RABBIT_DIR/icon.png" "$OUTPUT_DIR/package/"
cp "$RABBIT_DIR/screenshot.jpg" "$OUTPUT_DIR/package/"

# Remove screenshot-1.jpg if it exists (it's just a duplicate)
rm -f "$OUTPUT_DIR/package/screenshot-1.jpg"

# Create README for the package
echo -e "${BLUE}📝 Creating package README...${NC}"
cat > "$OUTPUT_DIR/package/README.txt" << EOF
Curling Timer X for Rabbit R1
Version: ${VERSION}
Package Date: $(date +"%Y-%m-%d %H:%M:%S")

INSTALLATION:
1. Download this .rabbit package
2. Generate a QR code pointing to the download URL
3. Scan with your Rabbit R1 device
4. The app will be installed automatically

USAGE:
- Side Button (Hold): Start/stop timer
- Scroll Wheel: Adjust ice speed
- Screen Tap: Record shot and reset

For more information, visit:
https://github.com/RiveCo/curlingTimerX

Package Structure:
- index.html        : Main app entry point
- assets/           : App assets (JS, CSS)
- manifest.json     : App metadata
- icon.png          : App icon (128x128)
- screenshot.jpg    : App screenshot (240x282)
EOF

# Create the .rabbit bundle (ZIP format)
echo -e "${BLUE}🗜️  Creating .rabbit bundle...${NC}"
cd "$OUTPUT_DIR/package"
zip -r "../${PACKAGE_NAME}" . -q
cd ../..

# Clean up temporary package directory
rm -rf "$OUTPUT_DIR/package"

# Create checksums
echo -e "${BLUE}🔒 Generating checksums...${NC}"
cd "$OUTPUT_DIR"
sha256sum "${PACKAGE_NAME}" > "${PACKAGE_NAME}.sha256"
md5sum "${PACKAGE_NAME}" > "${PACKAGE_NAME}.md5"
cd ..

# Display package info
PACKAGE_SIZE=$(du -h "$OUTPUT_DIR/${PACKAGE_NAME}" | cut -f1)
echo ""
echo -e "${GREEN}✅ Package created successfully!${NC}"
echo ""
echo "📦 Package Details:"
echo "   Name:     ${PACKAGE_NAME}"
echo "   Version:  ${VERSION}"
echo "   Size:     ${PACKAGE_SIZE}"
echo "   Location: ${OUTPUT_DIR}/${PACKAGE_NAME}"
echo ""
echo "🔗 Next Steps:"
echo "   1. Upload to GitHub Releases:"
echo "      gh release create v${VERSION} ${OUTPUT_DIR}/${PACKAGE_NAME} --title \"v${VERSION}\" --notes \"Release v${VERSION}\""
echo ""
echo "   2. Generate QR code pointing to:"
echo "      https://github.com/RiveCo/curlingTimerX/releases/download/v${VERSION}/${PACKAGE_NAME}"
echo ""
echo "   3. Or use the automated release workflow in GitHub Actions"
echo ""
