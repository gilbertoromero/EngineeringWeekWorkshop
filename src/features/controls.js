const WALK_SPEED = 2.4
const RUN_SPEED = 6.0
const ROLL_SPEED = 6.0
const ROLL_SPEED_RUNNING = 8.0
const ACCELERATION = 14
const TURN_SPEED = 12
const PLAYER_RADIUS = 0.45

/**
 * FEATURE 3 — CONTROLES
 * Convierte las teclas en movimiento, el movimiento en animación, y mantiene
 * la cámara detrás del jugador. Es el loop sobre el que se construye todo
 * juego de acción:
 *   leer la entrada -> mover -> resolver colisiones -> elegir una animación.
 */
function createControls(camera, domElement, character, level, options = {}) {
  // --- Entrada --------------------------------------------------------------
  const keys = new Set()
  window.addEventListener('keydown', (event) => {
    keys.add(event.code)
    if (event.code === 'Space') event.preventDefault() // que la página no haga scroll
  })
  window.addEventListener('keyup', (event) => keys.delete(event.code))
  window.addEventListener('blur', () => keys.clear()) // que alt-tab no deje una tecla atorada

  const held = (...codes) => codes.some((code) => keys.has(code))

  // --- Cámara ---------------------------------------------------------------
  const orbit = new THREE.OrbitControls(camera, domElement)
  orbit.enableDamping = true
  orbit.enablePan = false
  orbit.minDistance = 4
  orbit.maxDistance = 14
  orbit.minPolarAngle = 0.4 // que no se ponga justo encima
  orbit.maxPolarAngle = Math.PI / 2 - 0.05 // ni debajo del piso
  orbit.target.copy(character.model.position).add(new THREE.Vector3(0, 3, 0))

  // --- Estado ---------------------------------------------------------------
  const input = new THREE.Vector2()
  const velocity = new THREE.Vector3()
  const moveTo = new THREE.Vector3()
  const targetVelocity = new THREE.Vector3()
  const facing = new THREE.Vector3()
  const cameraForward = new THREE.Vector3()
  const cameraRight = new THREE.Vector3()
  const cameraTarget = new THREE.Vector3()
  const cameraShift = new THREE.Vector3()
  const cameraOffset = new THREE.Vector3(0, 1.1, 0)
  // https://threejs.org/docs/#Vector3

  let rolling = false
  let footstepTimer = 0
  let currentSpeed = 0

  function update(delta) {
    const model = character.model

    // 1. ¿Hacia dónde quiere ir el jugador, según la pantalla?
    input.set(0, 0)
    if (held('KeyW', 'ArrowUp')) input.y += 1
    if (held('KeyS', 'ArrowDown')) input.y -= 1
    if (held('KeyA', 'ArrowLeft')) input.x -= 1
    if (held('KeyD', 'ArrowRight')) input.x += 1
    /** Normalizamos los valores de input para que los movimientos en
     * diagonal no sean mas rápidos
     * */
    if (input.lengthSq() > 1) input.normalize()

    /**
     * 2. Usamos la orientación de la cámara para saber
     * hacia dónde está mirando. Aplanamos esa dirección sobre el piso (y = 0)
     * para que "adelante" no apunte hacia el suelo, y con un producto cruz
     * contra el vector "arriba" obtenemos "derecha".
     * https://threejs.org/docs/#Object3D.getWorldDirection
     * */
    camera.getWorldDirection(cameraForward)
    cameraForward.y = 0
    cameraForward.normalize()
    cameraRight.crossVectors(cameraForward, THREE.Object3D.DEFAULT_UP).normalize()

    moveTo
      .set(0, 0, 0)
      .addScaledVector(cameraForward, input.y)
      .addScaledVector(cameraRight, input.x)

    const wantsToMove = moveTo.lengthSq() > 0.0001
    if (wantsToMove) moveTo.normalize()

    // 3. Rodar (tecla C)
    if (held('KeyC') && !rolling && !character.isBusy()) {
      rolling = true
      character.playOnce('Roll')
      if (options.onRoll) options.onRoll()
    }
    if (rolling && !character.isBusy()) rolling = false

    // 4. Calculamos la velocidad de movimiento dependiendo de la acción.
    const running = held('ShiftLeft', 'ShiftRight')
    let targetSpeed = 0
    if (rolling) targetSpeed = running ? ROLL_SPEED_RUNNING : ROLL_SPEED
    else if (wantsToMove) targetSpeed = running ? RUN_SPEED : WALK_SPEED

    // Si ruedas sin presionar nada, sigue hacia donde mira el personaje.
    const heading = model.rotation.y
    facing.set(Math.sin(heading), 0, Math.cos(heading))
    const direction = wantsToMove ? moveTo : facing
    targetVelocity.copy(direction).multiplyScalar(targetSpeed)
    velocity.lerp(targetVelocity, Math.min(1, ACCELERATION * delta))

    // 5. Aplicamos la velocidad calculada segun la acción del personaje para movernos.
    model.position.addScaledVector(velocity, delta)
    // Procesamos colisiones, asegurando que level.resolveCollisions exista
    if (level.resolveCollisions) level.resolveCollisions(model.position, PLAYER_RADIUS)

    // 6. Voltear hacia donde vamos.
    const speed = velocity.length()
    if (speed > 0.1) {
      const targetAngle = Math.atan2(velocity.x, velocity.z)
      const current = model.rotation.y
      // Girar por el lado más corto del círculo.
      let difference = ((targetAngle - current + Math.PI) % (Math.PI * 2)) - Math.PI
      if (difference < -Math.PI) difference += Math.PI * 2
      model.rotation.y = current + difference * Math.min(1, TURN_SPEED * delta)
    }

    // 7. Elegir la animación que corresponde a lo que estamos haciendo.
    if (!character.isBusy()) {
      if (speed > RUN_SPEED * 0.6) character.play('Run')
      else if (speed > 0.25) character.play('Walk')
      else character.play('Idle')
    }

    // 8. SFX de pasos, mayor frecuencia al correr.
    if (!rolling && speed > 0.25) {
      footstepTimer -= delta * speed
      if (footstepTimer <= 0) {
        footstepTimer = 2.5
        if (options.onFootstep) options.onFootstep()
      }
    } else {
      footstepTimer = 0
    }

    // 9. Mantener la cámara pegada al jugador sin pelearse con el mouse.
    cameraTarget.copy(model.position).add(cameraOffset)
    cameraShift.copy(cameraTarget).sub(orbit.target)
    orbit.target.copy(cameraTarget)
    camera.position.add(cameraShift)
    orbit.update(delta)

    currentSpeed = speed
  }

  return {
    orbit,
    get speed() {
      return currentSpeed
    },
    update,
  }
}
