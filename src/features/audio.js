/**
 * FEATURE 4 — AUDIO
 *
 * three.js envuelve la Web Audio API:
 *   - un AudioListener va montado en la cámara (los oídos del jugador),
 *   - THREE.Audio suena "en todos lados" (la música),
 *
 * Los navegadores no dejan reproducir audio hasta que el usuario interactúa
 * con la página; por eso el demo empieza detrás de un click.
 *
 * @param {THREE.Camera} camera
 */
async function createAudio(camera) {
  const listener = new THREE.AudioListener()
  camera.add(listener)

  const context = listener.context
  const [ambientBuffer, stepBuffer] = await Promise.all([
    Assets.loadAudio(GameData.ambientMusic, context),
    Assets.loadAudio(GameData.stepSFX, context),
  ])

  const ambient = new THREE.Audio(listener)
  ambient.setBuffer(ambientBuffer)
  ambient.setLoop(true)
  ambient.setVolume(0.25)

  // Un pool pequeñito, para que los pasos que se enciman no se corten entre sí.
  const footsteps = []
  for (let i = 0; i < 4; i++) {
    const sound = new THREE.Audio(listener)
    sound.setBuffer(stepBuffer)
    sound.setVolume(0.35)
    footsteps.push(sound)
  }
  let nextFootstep = 0

  return {
    listener,

    // Inicia la música de fondo en loop. Tiene que pasar después de un click.
    startAmbient() {
      // El navegador nos da un AudioContext *suspendido* hasta que el usuario
      // interactúa con la página. Este es el click que lo despierta.
      if (context.state === 'suspended') context.resume()
      if (!ambient.isPlaying) ambient.play()
    },

    // Un paso, una sola vez. Lo llama el módulo de controles.
    playFootstep() {
      const sound = footsteps[nextFootstep]
      // Incrementamos el indice del SFX de pasos en el pool
      // al llegar al final el indice regresa a cero
      nextFootstep = (nextFootstep + 1) % footsteps.length
      if (sound.isPlaying) sound.stop()
      sound.play()
    },
  }
}
