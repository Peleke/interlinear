#!/bin/bash

# Generate PWA icons using ImageMagick or basic placeholders
# This is a quick script to create basic PWA icons

echo "Generating PWA icons..."

# Create a basic SVG icon
cat > public/base-icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#8b7355" rx="64"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="200" font-weight="bold"
        text-anchor="middle" fill="white">I</text>
</svg>
EOF

# Check if convert (ImageMagick) is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate PNG icons..."
    convert public/base-icon.svg -resize 192x192 public/icon-192x192.png
    convert public/base-icon.svg -resize 512x512 public/icon-512x512.png
    convert public/base-icon.svg -resize 180x180 public/apple-touch-icon.png
else
    echo "ImageMagick not available. Using curl to get placeholder icons..."
    # Use a placeholder service for proper sized icons
    curl -s "https://via.placeholder.com/192x192/8b7355/FFFFFF?text=I" -o public/icon-192x192.png
    curl -s "https://via.placeholder.com/512x512/8b7355/FFFFFF?text=I" -o public/icon-512x512.png
    curl -s "https://via.placeholder.com/180x180/8b7355/FFFFFF?text=I" -o public/apple-touch-icon.png
fi

echo "PWA icons generated successfully!"
ls -la public/*.png