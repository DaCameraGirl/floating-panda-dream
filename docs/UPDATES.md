# Floating Panda Dream Updates

This file tracks player-facing changes to the browser game so the README can stay concise while the project history remains easy to scan.

## June 11, 2026

### Browser Game Upgrade

- Expanded the browser version beyond the original MVP into a denser arcade sky-run.
- Added a floating panda with a helium balloon illustration to the README.
- Tightened sparkly dart firing so shots originate from a visible muzzle with a synced trail and flash.
- Added local best score tracking and a dream rank HUD.
- Added new goodies: moon pearls, prism gems, lotus blooms, dream kites, and comet crumbs.
- Added new powerups: star magnets that pull collectibles closer and lullaby bells that clear nearby hazards.
- Added new hazards: thorn spirals, eclipse shards, and gravity knots.
- Increased object density with faster pacing, paired ring spawns, and more frequent bonus moments.
- Brightened the visual direction with layered sky scenery, lanterns, petals, crystals, islands, moon glow, richer trails, and larger burst effects.
- Tightened the HUD, mobile touch controls, theme color, and offline PWA cache.
- Updated docs to clarify that the GitHub Pages browser version is the richer game and the Panda3D version is a simpler local reference.

### Validation

- Ran `node --check game.js`.
- Ran a Node-based DOM/canvas smoke test for startup, first-frame render, and Start button wiring.
- Ran `git diff --check`.
