**English** · [Español](README.es.md)

# Press Start: Intro to Game Development

A workshop created for **Engineering Week at ULSA Noroeste**. It was presented
to students of all levels, but it's aimed mainly at students in their
**1st to 5th semester**.

In one session, students build a small 3D game with
[three.js](https://threejs.org): a character that walks, runs, rolls and
jumps, with music, footsteps and a portal made with shaders.

> Code comments are in Spanish: this workshop was built for and taught to
> Spanish-speaking students.

## How to use it

1. Download or copy this whole folder.
2. Double-click `index.html`.
3. Click **Press Start** (browsers don't allow audio to play before a click).

To edit: open any file in `src/` in a text editor, save, and reload the page.

## Controls

- **WASD / arrow keys**: move
- **Shift**: run
- **Space**: jump
- **C**: roll
- **Mouse**: rotate and zoom the camera

## Why just an `index.html`

The school's computer labs don't allow installing software: no Node, no npm,
no local server. That's why the workshop is built to run by opening
`index.html` straight from the folder, with nothing to install.

Opening a page with a double-click (`file://`) has its limits, and the project
is built around them:

- **No `import` / `export`.** Each file is loaded with a plain `<script>` tag,
  so **the order of the `<script>` tags in `index.html` matters**: a file can
  only use what the files above it have already defined.
- **No loading separate files.** The browser won't read the `.glb`, `.png` or
  audio files, so they're converted to base64 inside `data/*.js`.
- **Shaders as text.** The GLSL code lives in strings inside
  `src/shaders/portal.js`.

## How it's organized

```
├─ index.html               loads every <script> in order
├─ libs/three.global.js     three.js + OrbitControls + GLTFLoader
├─ data/                    models, textures and audio as base64
└─ src/
   ├─ scene/main-scene.js   ⬅ start reading here
   ├─ core/engine.js        renderer + camera + the game loop
   ├─ assets.js             turns the base64 into models, textures and sounds
   ├─ features/
   │  ├─ level.js           1. floor, pillars, lights, collisions
   │  ├─ character.js       2. the character and its animations
   │  ├─ audio.js           3. background music + footsteps
   │  ├─ controls.js        4. keyboard → movement → animation → camera
   │  ├─ vfx.js             5. the portal: .glb archway + custom shader
   │  └─ jump.js            6. gravity and jumping
   └─ shaders/portal.js     the portal's GLSL
```

## Credits

- 3D models (character and archway): [Quaternius](https://quaternius.com), via
  [Poly Pizza](https://poly.pizza), CC0
- [three.js](https://threejs.org): MIT, © three.js authors
