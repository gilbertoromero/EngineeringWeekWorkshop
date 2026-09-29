/**
 * EL NIVEL
 * Objetos básicos + luces. Al cambiar valores aqui cambia el ambiente del juego
 */
/** @param {THREE.Scene} scene */
function createLevel(scene) {
  const group = new THREE.Group()
  group.name = 'Level'
  scene.add(group)

  const bounds = 60

  // --- Atmosfera -----------------------------------------------------------
  scene.background = new THREE.Color('#b3c0ed')

  // --- Luces ---------------------------------------------------------------
  // Luz para iluminar la escena de manera global
  const light = new THREE.AmbientLight(0x404040, 20)
  group.add(light)

  // Luz direccional que nos permitirá mostrar sombras en la escena (un sol).
  const sun = new THREE.DirectionalLight('#ffe8c4', 2.2)
  sun.position.set(10, 16, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -26
  sun.shadow.camera.right = 26
  sun.shadow.camera.top = 26
  sun.shadow.camera.bottom = -26
  sun.shadow.bias = -0.0008
  group.add(sun)

  // --- Piso -----------------------------------------------------------------
  const groundMap = Assets.loadTexture(GameData.groundGlyphsPng)
  groundMap.wrapS = THREE.RepeatWrapping
  groundMap.wrapT = THREE.RepeatWrapping
  groundMap.repeat.set(10, 10) // repetir la textura en lugar de estirarla
  groundMap.colorSpace = THREE.SRGBColorSpace

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(bounds / 2, 30),
    new THREE.MeshStandardMaterial({ map: groundMap }),
  )
  //Hay que rotar el suelo ya que los circulos aparecen en posicion vertical
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  group.add(ground)

  // Dónde se ubica el arco del portal (lo arma src/features/vfx.js). Queda frente
  // a la cámara inicial y detras del punto donde aparece el personaje.
  const portalPosition = new THREE.Vector3(0, 0, -8)

  // --- Obstáculos -----------------------------------------------------------
  // Todo lo que el jugador no puede atravesar
  const obstacles = []
  const pillarMaterial = new THREE.MeshStandardMaterial({ color: '#65676b' })

  const pillarCount = 8
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2
    const distance = 12
    const radius = 0.9
    const height = 4 + (i % 3)
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance

    // Nos saltamos el pilar que quedaría justo detrás del portal.
    if (Math.hypot(x - portalPosition.x, z - portalPosition.z) < 5) continue

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.15, height, 12),
      pillarMaterial,
    )
    pillar.position.set(x, height / 2, z)
    pillar.castShadow = true
    pillar.receiveShadow = true
    group.add(pillar)

    obstacles.push({ center: new THREE.Vector2(pillar.position.x, pillar.position.z), radius })
  }

  return {
    group,
    bounds,
    portalPosition,
    obstacles,

    // La "colisión" más simple que hay: círculos contra círculos.

    resolveCollisions(position, playerRadius) {
      // Mantener al jugador dentro de los limites(bounds) del nivel.
      const flat = new THREE.Vector2(position.x, position.z)
      const maxDistance = bounds / 2 - playerRadius
      if (flat.length() > maxDistance) {
        flat.setLength(maxDistance)
      }

      // Se calcula la distancia entre el jugador y los obstáculos,
      // si las posiciones se enciman se mueve el jugador fuera de
      // ellos.
      for (const obstacle of obstacles) {
        // Resta entre ambos vectores de posición para calcular
        // la distacia entre el jugador y los pilares
        const distanceToPlayer = flat.clone().sub(obstacle.center)
        const minDistance = obstacle.radius + playerRadius
        if (distanceToPlayer.length() < minDistance) {
          distanceToPlayer.setLength(minDistance)
          flat.copy(obstacle.center).add(distanceToPlayer)
        }
      }

      position.x = flat.x
      position.z = flat.y
    },
  }
}
