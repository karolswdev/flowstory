#!/bin/bash
# Generate demo GIFs for README
# Usage: ./scripts/generate-demo-gifs.sh

set -e

cd "$(dirname "$0")/.."

DEMOS_DIR="docs/demos"
mkdir -p "$DEMOS_DIR"

# Function to generate GIF from screenshots
generate_gif() {
  local story_id=$1
  local output_name=$2
  local delay=${3:-100}  # centiseconds (100 = 1 second per frame)
  
  echo "📸 Capturing screenshots for $story_id..."
  npx tsx scripts/screenshot-slides.ts "$story_id"
  
  echo "🎬 Converting to GIF..."
  # Use ffmpeg to create GIF with good quality
  ffmpeg -y -framerate 1 -pattern_type glob -i "screenshots/${story_id}/step-*.png" \
    -vf "fps=1,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \
    "$DEMOS_DIR/${output_name}.gif" 2>/dev/null
  
  echo "✅ Generated $DEMOS_DIR/${output_name}.gif"
}

# Start dev server in background if not running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "🚀 Starting dev server..."
  npm run dev &
  DEV_PID=$!
  sleep 5
  trap "kill $DEV_PID 2>/dev/null" EXIT
fi

# Generate demo GIFs for each story type
echo ""
echo "=== Generating Demo GIFs ==="
echo ""

# Stories with inline YAML (from App.tsx)
generate_gif "user-registration" "demo-user-story"
generate_gif "checkout-flow" "demo-checkout-flow"
generate_gif "password-reset" "demo-password-reset"

echo ""
echo "=== Done! ==="
echo ""
ls -la "$DEMOS_DIR"/*.gif
