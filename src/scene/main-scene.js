/**
 * ============================================================================
 *  ESCENA PRINCIPAL.
 * ============================================================================
 *
 *   1. NIVEL      src/features/level.js      piso, objetos, luces, colisiones
 *   2. PERSONAJE  src/features/character.js  carga un .glb y configura sus animaciones
 *   3. AUDIO      src/features/audio.js      música y sfx
 *   4. CONTROLES  src/features/controls.js   teclado -> movimiento -> animación
 *   5. VFX        src/features/vfx.js        un arco .glb + un portal hecho con shaders
 *   6. SALTO      src/features/jump.js       gravedad + piso, tecla Espacio
 *
 * El último bloque conecta todo con el loop de cada frame. Ese loop — leer la
 * entrada, actualizar el mundo, dibujarlo — *es* un motor de juego.
 */
async function createMainScene(engine) {
  const scene = engine.scene
  const camera = engine.camera

  // --- Cámara libre ---------------------------------------------------------
  // Para explorar la escena con el mouse mientras la armamos.
  //new THREE.OrbitControls(camera, engine.renderer.domElement);
  // paso 4 (CONTROLES), esta linea se puede borrar o comentar:
  // el jugador trae su propia cámara.

  // 1. NIVEL ----------------------------------------------------------------
  const level = createLevel(scene)

  // 2. PERSONAJE ------------------------------------------------------------
  const character = await loadCharacter(scene)
  character.model.position.set(0, 0, 0)

  // 3. AUDIO ----------------------------------------------------------------
  const audio = await createAudio(camera)
  engine.onStart(() => audio.startAmbient())

  // 4. CONTROLES ------------------------------------------------------------
  const player = createControls(camera, engine.renderer.domElement, character, level, {
    onFootstep: () => audio.playFootstep(), // necesita el paso 3 (AUDIO)
  })

  // 5. VFX ------------------------------------------------------------------
  const portal = await createPortal(scene, level.portalPosition)
  level.obstacles.push(...portal.obstacles) // las patas del arco también colisionan

  // 6. SALTO ----------------------------------------------------------------
  const jump = enableJump(character)

  // --- El loop actualizado cada frame -----------------------------------------
  engine.onUpdate((delta, elapsed) => {
    player.update(delta) // entrada + movimiento + colisiones + cámara
    character.update(delta) // actualiza el mixer de animaciones
    portal.update(delta, elapsed) // le pasa el tiempo al shader
    jump.update(delta) // gravedad + piso
  })
}
