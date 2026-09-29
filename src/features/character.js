/**
 * FEATURE 1 — EL PERSONAJE
 * Carga un .glb (un modelo 3D + su esqueleto + sus animaciones, en un solo
 * archivo) y conecta un AnimationMixer para mezclar entre clips.
 *
 * Clips dentro de character.glb:
 *   Idle, Walk, Run, Roll, Punch, Dagger_Attack, Dagger_Attack2,
 *   Attacking_Idle, PickUp, RecieveHit, RecieveHit_Attacking, Death
 *
 * @param {THREE.Scene} scene
 * @param {number} targetHeight qué tan alto debe quedar el personaje, en metros
 */
async function loadCharacter(scene, targetHeight = 1.7) {
  const gltf = await Assets.loadModel(GameData.characterGlb)

  const model = gltf.scene
  model.name = 'Character'

  /** Como el modelo fue descargado de PollyPizza, la escala del personaje
   * puede no ajustarse el tamaño del suelo o los objetos del nivel.
   * La normalizamos: 1 unidad === 1 metro en nuestro mundo.
   * */
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
  model.scale.multiplyScalar(targetHeight / size.y)

  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })
  scene.add(model)

  // --- Animación ------------------------------------------------------------
  const mixer = new THREE.AnimationMixer(model) // https://threejs.org/docs/#AnimationMixer

  /**
   * El archivo .glb fue descargado de PollyPizza y trae un duplicado
   * de cada animación ("Run" y "CharacterArmature|Run").
   * Aplicamos un 'filtro' para guardar solo el nombre corto ('Run'por ejemplo).
   * https://threejs.org/docs/#AnimationAction
   */
  const actions = new Map()
  for (const clip of gltf.animations) {
    const shortName = clip.name.split('|').pop()
    if (actions.has(shortName)) continue
    actions.set(shortName, mixer.clipAction(clip))
  }

  let looping = null
  let loopingName = 'Idle'
  let oneShot = null

  function get(name) {
    const action = actions.get(name)
    if (!action) console.warn('[character] no clip named "' + name + '"')
    return action
  }

  // Inicia (o hace crossfade hacia) una animación en loop.
  function play(name, fadeSeconds = 0.2) {
    const animation = get(name)
    // Si la animación no existe o si es la misma animación corriendo, regresamos si ejecutar nada
    if (!animation || animation === looping) return

    animation.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(fadeSeconds).play()
    if (looping) looping.fadeOut(fadeSeconds)
    looping = animation
    loopingName = name
  }

  // Reproduce el clip de animación una vez y luego regresa al que estaba en loop.
  function playOnce(name, fadeSeconds = 0.12) {
    const animation = get(name)
    if (!animation || oneShot) return

    animation.reset().setLoop(THREE.LoopOnce, 1).fadeIn(fadeSeconds).play()
    animation.clampWhenFinished = true
    if (looping) looping.fadeOut(fadeSeconds)
    oneShot = animation

    const onFinished = (event) => {
      if (event.action !== animation) return
      mixer.removeEventListener('finished', onFinished)
      animation.fadeOut(fadeSeconds)
      oneShot = null

      // Regresa al clip en loop que interrumpimos.
      const resume = actions.get(loopingName)
      if (resume) resume.reset().fadeIn(fadeSeconds).play()
      looping = resume || null
    }
    mixer.addEventListener('finished', onFinished)
  }

  play('Idle', 0)

  return {
    model,
    play,
    playOnce,
    // true mientras un clip de playOnce sigue corriendo.
    isBusy: () => oneShot !== null,
    // Avanza la animación. Hay que llamarla en cada frame.
    update: (delta) => mixer.update(delta),
    // Todos los nombres de clips del archivo — útil para experimentar.
    clipNames: [...actions.keys()],
  }
}
