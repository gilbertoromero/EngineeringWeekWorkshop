/**
 * Punto de entrada. Hace tres cosas y nada más:
 *   1. Inicializa el Engine (renderer + cámara + loop de juego),
 *   2. Crea la escena y los objetos en ella (main-scene.js es donde pasa todo lo divertido),
 *   3. Arranca el loop de juego al primer click, el audio ya puede sonar después
 *   de esta primera interacción.
 */
;(async function main() {
  const canvas = document.querySelector('#app')
  const startButton = document.querySelector('#start')
  const startLabel = startButton.querySelector('#start-label')

  try {
    const engine = new Engine(canvas)
    await createMainScene(engine)

    startLabel.textContent = 'Press Start'
    startButton.disabled = false
    startButton.addEventListener(
      'click',
      () => {
        startButton.hidden = true
        engine.start()
      },
      { once: true },
    )
  } catch (error) {
    console.error(error)
    startLabel.textContent = 'Error: ' + error.message + ' (abre la consola con F12)'
  }
})()
