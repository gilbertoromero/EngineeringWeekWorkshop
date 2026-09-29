/**
 * FEATURE 5 — VFX CON TEXTURAS + SHADERS
 *
 * El portal tiene dos partes:
 *   - el arco, un modelo .glb normal (igual que el personaje),
 *   - un plano en la entrada del arco, pintado por nuestro propio material.
 *
 * Un material es un programa pequeñito que corre en la GPU:
 *   - el vertex shader mueve puntos,
 *   - el fragment shader pinta pixeles.
 * Le pasamos una textura de ruido y el tiempo actual, y la GPU hace el resto —
 * millones de pixeles por frame, todos en paralelo.
 *
 * El código de los shaders vive en src/shaders/portal.js.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} position dónde se para el arco, sobre el piso
 * @param {number} targetHeight qué tan alto queda el arco, en metros
 */
async function createPortal(scene, position, targetHeight = 4.5) {
  const group = new THREE.Group()
  group.name = 'Portal'
  group.position.copy(position)
  scene.add(group)

  // --- El arco --------------------------------------------------------------
  const gltf = await Assets.loadModel(GameData.archwayGlb)
  const archway = gltf.scene

  // Mismo truco que con el personaje: lo escalamos a metros y lo paramos en
  // el piso (el modelo trae su base un poco abajo de y = 0).
  const box = new THREE.Box3().setFromObject(archway)
  const scale = targetHeight / box.getSize(new THREE.Vector3()).y
  archway.scale.setScalar(scale)
  archway.position.y = -box.min.y * scale

  archway.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })
  group.add(archway)

  // Medidas de la entrada, tomadas del archivo archway.glb (en sus unidades).
  // Si cambias de modelo, estas son las que hay que volver a medir.
  const OPENING_WIDTH = 500
  const OPENING_HEIGHT = 600
  const LEG_CENTER_X = 312 // centro de cada pata del arco
  const LEG_RADIUS = 70

  const openingWidth = OPENING_WIDTH * scale
  const openingHeight = OPENING_HEIGHT * scale

  // --- La entrada: un plano con nuestro shader ------------------------------
  // El shader desplaza las UVs más allá de 0–1, así que la textura se repite.
  const noise = Assets.loadTexture(GameData.turbulencePng)
  noise.wrapS = THREE.RepeatWrapping
  noise.wrapT = THREE.RepeatWrapping

  // Los 'uniforms' son los valores que mandamos desde JavaScript al shader.
  const uniforms = {
    uTime: { value: 0 },
    uNoiseTex: { value: noise }, // la textura de ruido que mueve todo
    uColorLow: { value: new THREE.Color('#4a0d05') }, // zonas de poca intensidad
    uColorMid: { value: new THREE.Color('#c0301a') }, // intensidad media
    uColorHigh: { value: new THREE.Color('#ffc23d') }, // lo más brillante
    uCoreColor: { value: new THREE.Color('#140402') }, // el centro del túnel
    uEdgeColor: { value: new THREE.Color('#ffb000') }, // la orilla que se disuelve
    uBloom: { value: 1.0 }, // multiplica el brillo
    uSwirlSpeed: { value: 0.0 }, // qué tan rápido gira el efecto
    uTwist: { value: 0.3 }, // qué tan torcida está el efecto
    uInflow: { value: 0.25 }, // qué tan rápido se va el dibujo hacia el centro
    uWarpAmp: { value: 0.05 }, // intensidad de la turbulencia (0.03–0.08)
    uDisplaceAmp: { value: 0.12 }, // qué tanto ondula la superficie
    uDissolve: { value: 0.25 }, // umbral de disolución, valores más altos 'desaparece' más area del efecto
    uOpen: { value: 1.0 }, // tamaño del portal: 1 = completo
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: PORTAL_VERTEX_SHADER,
    fragmentShader: PORTAL_FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  // Suficientes segmentos para que la onda del vertex shader pueda ondular la superficie del portal.
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(openingWidth, openingHeight, 32, 32),
    material,
  )
  surface.position.y = openingHeight / 2 // el plano nace centrado; lo subimos al piso
  group.add(surface)

  // --- Colisiones -----------------------------------------------------------
  // Las patas del arco son sólidas. Para las colisiones, un obstáculo es solo
  // un círculo en el piso, sea cual sea la forma del modelo.
  const obstacles = [-1, 1].map((side) => ({
    center: new THREE.Vector2(position.x + side * LEG_CENTER_X * scale, position.z),
    radius: LEG_RADIUS * scale,
  }))

  return {
    group,
    obstacles,
    update(delta, elapsed) {
      // Mandarle 'elapsed' al shader es lo que hace que el efecto se mueva.
      uniforms.uTime.value = elapsed
    },
  }
}
