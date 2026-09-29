/**
 * La parte aburrida pero necesaria de cualquier juego: un canvas, una cámara y
 * un loop que vuelve a dibujar todo ~60 veces por segundo.
 *
 * Casi nunca hace falta tocar este archivo. Todo lo que construyan se conecta
 * con `engine.onUpdate(...)`.
 */
class Engine {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    this.scene = new THREE.Scene()

    // fov, aspect, near, far — la forma de lo que la cámara alcanza a ver.
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
    this.camera.position.set(0, 4, 8)

    this.clock = new THREE.Clock()

    /** @type {Array<(delta: number, elapsed: number) => void>} */
    this.updates = []
    /** @type {Array<() => void>} */
    this.starters = []

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  /** Registra los elementos que necesitan actualizarse cada frame (movimiento, animación, tiempo del shader...). */
  onUpdate(fn) {
    this.updates.push(fn)
  }

  /** Registra algo que corre una sola vez, cuando arranca el loop (el audio lo necesita). */
  onStart(fn) {
    this.starters.push(fn)
  }

  /** Inicia el loop de juego. */
  start() {
    for (const starter of this.starters) starter()
    this.clock.start()
    this.renderer.setAnimationLoop(() => {
      const delta = Math.min(this.clock.getDelta(), 0.1) // tope por si cambiaste de pestaña
      const elapsed = this.clock.elapsedTime
      for (const update of this.updates) update(delta, elapsed)
      this.renderer.render(this.scene, this.camera)
    })
  }

  resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }
}
