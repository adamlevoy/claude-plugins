---
name: image-gen
description: Generate images from text prompts or edit/restyle existing images using Google's Nano Banana 2 (Gemini) and Imagen 4. Use this skill whenever the user asks to generate an image, create a picture, make artwork, edit a photo, remove a background, restyle an image, apply a visual style, or use an image as inspiration. Also use when the user asks for photorealistic images, realistic photos, or requests Imagen specifically. Triggers on "generate an image of...", "create a picture of...", "edit this photo to...", "make this look like...", "remove the background from...", "generate a logo/poster/banner/illustration", "use this image as inspiration", "photorealistic image of...", or any request to produce or manipulate visual content. Always use this skill for image tasks.
---

# image-gen

Generate and edit images using two Google APIs:
- **Nano Banana 2** (default) — fast, flexible, supports editing and reference images
- **Imagen 4** — photorealistic text-to-image, no image inputs

Saves to `~/Desktop` by default and opens in Preview automatically.

## Setup (one-time)

The API key is stored in macOS Keychain. Check if it exists:
```bash
security find-generic-password -s gemini-api-key -w
```

If not found:
```bash
security add-generic-password -a gemini -s gemini-api-key -w YOUR_KEY_HERE
```

## Which model to use

| Situation | Model to pass |
|---|---|
| Any image generation (default) | *(omit --model)* → `flash` |
| User explicitly wants photorealistic, no input images | `imagen` |
| User wants maximum quality photorealistic | `imagen-ultra` |
| Quick photorealistic drafts | `imagen-fast` |
| Editing a photo, removing background, etc. | `flash` or `pro` |
| Style transfer, reference-based generation | `flash` or `pro` |
| Highest quality editing | `pro` |

**Key rule**: if the user provides input images, always use a Nano Banana model (Imagen doesn't support image inputs). If the user asks for "photorealistic" with no input images, use `imagen`.

## Running the script

```bash
# Text-to-image (default: Nano Banana flash)
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "a misty mountain lake at dawn, cinematic, golden hour"

# Photorealistic (Imagen 4)
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "golden retriever running in a sunlit meadow, DSLR, f/2.8" \
  --model imagen

# Edit a photo
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "remove the background and replace with a white studio backdrop" \
  --input ~/Desktop/photo.jpg

# Style transfer
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "paint this subject in the style of the second image" \
  --input ~/Desktop/subject.jpg \
  --input ~/Desktop/style_reference.jpg

# Multiple variations
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "minimalist logo for a coffee shop called Drift" \
  --count 3 --aspect 1:1 --size 2K --model pro

# Specific output path
python3 ~/.claude/skills/image-gen/scripts/gemini_image.py \
  --prompt "hero banner, abstract geometric, deep blue and gold" \
  --aspect 16:9 --model imagen-ultra \
  --output ~/Desktop/hero_banner.png
```

## Arguments

| Argument | Values | Default | Description |
|---|---|---|---|
| `--prompt` | string | required | What to generate or how to edit |
| `--input` | file path | none | Input image(s), repeatable up to 14 (Nano Banana only) |
| `--model` | see table above | `flash` | Which model/API to use |
| `--aspect` | `1:1` `16:9` `9:16` `4:3` `3:4` `4:5` `2:3` etc. | `1:1` | Output aspect ratio |
| `--size` | `512px` `1K` `2K` `4K` | `1K` | Nano Banana resolution |
| `--count` | integer | `1` | Number of images |
| `--output` | path | `~/Desktop` | Directory or exact .png file path |
| `--no-preview` | flag | off | Skip opening in Preview.app |

## Aspect ratio guidance

- Social: `1:1` or `4:5`
- Hero/banner: `16:9` or `21:9`
- Portrait/mobile: `9:16` or `4:5`
- Print: `3:4` or `2:3`

## Multi-turn editing

The conversation remembers the last saved image path. After generating, you can say "now make the sky purple" or "add fog in the background" and pass the previously saved file as `--input`. You can always reference a specific path explicitly.

All generated images include a Google SynthID watermark (invisible, pixel-embedded).
