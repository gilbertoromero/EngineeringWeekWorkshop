[English](README.md) · **Español**

# Press Start: Intro al Desarrollo de Videojuegos

Taller creado para la **Semana de Ingenierías de ULSA Noroeste**. Se presentó a
estudiantes de todos los niveles, pero está pensado principalmente para
estudiantes de **1.º a 5.º semestre**.

En una sesión se arma un mini-juego en 3D con [three.js](https://threejs.org):
un personaje que camina, corre, rueda y salta, con música, pasos y un portal
hecho con shaders.

## Cómo se usa

1. Descarga o copia esta carpeta completa.
2. Doble click en `index.html`.
3. Click en **Press Start** (el navegador no deja sonar audio antes de un click).

Para editar: abre cualquier archivo de `src/` en un editor de texto, guarda y
recarga la página.

## Controles

- **WASD / flechas**: moverse
- **Shift**: correr
- **Espacio**: saltar
- **C**: rodar
- **Mouse**: girar y acercar la cámara

## Por qué solo un `index.html`

En los laboratorios de la escuela no se puede instalar software: no hay Node,
ni npm, ni un servidor local. Por eso el taller está hecho para funcionar
abriendo `index.html` directo desde la carpeta, sin instalar nada.

Abrir una página con doble click (`file://`) tiene sus límites, y el proyecto
está armado alrededor de ellos:

- **Sin `import` / `export`.** Cada archivo se carga con un `<script>` normal,
  así que **el orden de los `<script>` en `index.html` importa**: un archivo
  solo puede usar lo que ya definieron los de arriba.
- **Sin cargar archivos sueltos.** El navegador no deja leer los `.glb`, `.png`
  o los audios, así que vienen convertidos a base64 dentro de
  `data/*.js`.
- **Shaders como texto.** El código GLSL vive en strings dentro de
  `src/shaders/portal.js`.

## Cómo está organizado

```
├─ index.html               carga todos los <script> en orden
├─ libs/three.global.js     three.js + OrbitControls + GLTFLoader
├─ data/                    modelos, texturas y audio en base64
└─ src/
   ├─ scene/main-scene.js   ⬅ empieza a leer aquí
   ├─ core/engine.js        renderer + cámara + el loop del juego
   ├─ assets.js             convierte el base64 en modelos, texturas y sonidos
   ├─ features/
   │  ├─ level.js           1. piso, pilares, luces, colisiones
   │  ├─ character.js       2. el personaje y sus animaciones
   │  ├─ audio.js           3. música de fondo + pasos
   │  ├─ controls.js        4. teclado → movimiento → animación → cámara
   │  ├─ vfx.js             5. el portal: arco .glb + shader propio
   │  └─ jump.js            6. gravedad y salto
   └─ shaders/portal.js     el GLSL del portal
```

## Créditos

- Modelos 3D (personaje y arco): [Quaternius](https://quaternius.com), vía
  [Poly Pizza](https://poly.pizza), CC0
- [three.js](https://threejs.org): MIT, © three.js authors
