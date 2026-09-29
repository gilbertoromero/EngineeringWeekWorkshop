const GRAVITY = 20 // metros por segundo², hacia abajo (la Tierra real es 9.8)
const JUMP_HEIGHT = 1.2 // qué tan alto sube el personaje, en metros

/**
 * FEATURE 6 — SALTO
 * Física de un solo eje: el personaje tiene una velocidad vertical, la
 * gravedad se la va quitando cada frame, y el piso lo detiene.
 *
 * @param {{ model: THREE.Object3D }} character
 */
function enableJump(character) {
  const groundY = 0

  // ¿Con qué velocidad hay que salir para llegar a JUMP_HEIGHT? De la física:
  // v² = 2 · g · h. Así ajustamos la altura y no un número mágico.
  const jumpSpeed = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT)

  let velocityY = 0
  let grounded = true
  let wantsToJump = false

  // Un salto por cada vez que presionas la tecla (event.repeat es true
  // cuando la dejas presionada).
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.repeat) wantsToJump = true
  })

  function update(delta) {
    const position = character.model.position

    // 1. Solo se puede saltar desde el piso.
    if (wantsToJump && grounded) {
      velocityY = jumpSpeed
      grounded = false
    }
    wantsToJump = false

    // 2. La gravedad le quita velocidad hacia arriba (y luego la suma hacia abajo).
    velocityY -= GRAVITY * delta
    position.y += velocityY * delta

    // 3. Si tocamos o atravesamos el piso nos regresa a 0 y detiene la caída.
    if (position.y <= groundY) {
      position.y = groundY
      velocityY = 0
      grounded = true
    }
  }

  return {
    update,
    get grounded() {
      return grounded
    },
  }
}
