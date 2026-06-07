# 🐼✨ Floating Panda Dream

A dreamy little arcade game where you guide a floating panda through a neon sky lane, grab glowing goodies, thread lantern rings, and dodge sleepy hazards before the dream timer runs out.

🎮 **Play now:** https://dacameragirl.github.io/floating-panda-dream/

## 🌈 What You Can Play

### 🌐 GitHub Pages Browser Game

The live Pages version is a self-contained browser game in `index.html`:

- 🐼 Floating panda character
- 🖱️ Mouse steering: hold/click the playfield and guide the panda
- 📱 Touch steering and on-screen mobile controls
- ⌨️ Keyboard controls
- ⚡ Dash move
- 🍬 Moon candy
- ⭐ Star fruit
- 🫧 Dream bubbles
- ⏰ Time charms
- 🪽 Dash feathers
- 🏮 Lantern rings
- 🌩️ Storm bolts
- 💤 Sleepy pillows
- 👻 Ghost clouds
- 🌈 Neon sky, glow bursts, and colorful collision effects

### 🐍 Panda3D Python MVP

The repo also keeps the original local Panda3D version in `src/`. That version runs as a desktop Python game.

## 🕹️ Controls

### Browser / GitHub Pages

- 🖱️ **Mouse:** hold/click the game area to steer toward the pointer
- 🖱️ **Double-click:** dash
- 📱 **Touch:** hold the screen to steer, or use the on-screen buttons
- ⌨️ **WASD / Arrow keys:** move
- ⚡ **Space:** dash

### Python / Panda3D

- ⌨️ `WASD` or arrow keys: float around
- ⚡ `Space`: short dash
- 🔁 `R`: restart
- 🚪 `Esc`: quit

## 🧪 Languages Used

| Language | Where | What It Does |
| --- | --- | --- |
| 🌐 **HTML** | `index.html` | Browser game structure for GitHub Pages |
| 🎨 **CSS** | embedded in `index.html` | Neon styling, HUD, overlays, touch controls |
| 🟨 **JavaScript** | embedded in `index.html` | Canvas game loop, physics, collisions, input, scoring |
| 🐍 **Python** | `src/` | Original Panda3D desktop game MVP |
| 📦 **Requirements text** | `requirements.txt` | Python dependency list for the Panda3D version |

GitHub's language meter may show mostly **HTML** and **Python** because the CSS and JavaScript are bundled inside the static `index.html` file.

## 🚀 Run Locally

### 🌐 Browser Version

Open `index.html` in a modern browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### 🐍 Panda3D Version

```bash
pip install -r requirements.txt
python src/main.py
```

## 🏆 Goal

Score as high as possible before time runs out:

- 🍬 Collect goodies for points
- 🏮 Chain lantern rings to build streaks
- 🫧 Use dream bubbles for protection
- ⏰ Grab time charms to extend the run
- ⚡ Use dash feathers and Space/double-click dashes to escape danger
- 🌩️ Avoid hazards that drain energy or break streaks

## 📁 Project Structure

```text
.
├── index.html          # GitHub Pages browser game
├── src/                # Panda3D Python game
├── requirements.txt    # Python dependencies
├── README.md
└── LICENSE
```

## 💭 Notes

The browser game is the best version for GitHub Pages because it runs completely in the browser with no server. The Python/Panda3D version is still useful as a local desktop MVP and reference implementation.
