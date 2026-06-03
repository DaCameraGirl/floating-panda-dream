# Floating Panda Dream

A small Panda3D arcade MVP: pilot a floating panda through a dreamy sky lane, collect moon candy, chain lantern rings, and dodge ghost clouds before the timer runs out.

## Run

```bash
pip install -r requirements.txt
python src/main.py
```

## Controls

- `WASD` or arrow keys: float around
- `Space`: short dash
- `R`: restart
- `Esc`: quit

## Gameplay

- Moon candy gives points.
- Lantern rings give bigger points and increase your streak.
- Ghost clouds drain energy and break your streak.
- Score as much as possible before time runs out.

## Notes

The game tries to load Panda3D's classic `panda` model. If that asset is unavailable, it renders a simple placeholder so the game loop still works.
