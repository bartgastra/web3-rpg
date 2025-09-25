# Game Assets

This directory contains 16-bit style game assets for Aetherium RPG.

## Directory Structure

```
assets/
├── characters/          # Character sprites and avatars
│   ├── warrior/        # Warrior class sprites
│   ├── mage/           # Mage class sprites
│   └── rogue/          # Rogue class sprites
├── enemies/            # Enemy sprites
│   ├── goblin.png
│   ├── orc.png
│   ├── skeleton.png
│   └── dragon.png
├── items/              # Item icons
│   ├── weapons/        # Weapon icons
│   ├── armor/          # Armor icons
│   ├── consumables/    # Potion and consumable icons
│   └── accessories/    # Accessory icons
├── ui/                 # UI elements
│   ├── buttons/        # Button sprites
│   ├── frames/         # Window frames
│   └── icons/          # Various UI icons
└── backgrounds/        # Background images
    ├── battle/         # Battle backgrounds
    ├── menu/           # Menu backgrounds
    └── world/          # World map backgrounds
```

## Asset Guidelines

- All sprites should be in 16-bit pixel art style
- Use consistent color palettes
- Recommended sizes:
  - Character sprites: 32x32px or 64x64px
  - Item icons: 32x32px
  - UI elements: Variable, but maintain pixel-perfect scaling
  - Backgrounds: 800x600px or higher

## File Formats

- PNG format preferred for transparency support
- Use indexed color mode when possible to maintain authentic pixel art look
- Avoid anti-aliasing to preserve sharp pixel edges

## Usage

Assets are referenced in the frontend application and can be imported as needed. The build system will optimize and bundle these assets automatically.