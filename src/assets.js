/**
 * ASSETS — por qué existe este archivo.
 *
 * Un navegador abierto con file:// se niega a leer archivos locales (trata
 * cada carpeta como un sitio web distinto y no confiable). Así que no podemos
 * cargar el .glb, las texturas .png ni los sonidos .wav/.mp3 de la forma normal.
 *
 * La solución: cada asset se convirtió a texto base64 y se guardó en
 * data/*.js, que se carga como un <script> normal. Este archivo convierte ese
 * texto otra vez en algo que three.js entiende.
 *
 * Con un servidor web nos ahorraríamos todo esto: ni convertir los assets a
 * base64 ni decodificarlos. Solo usamos `loader.load('models/character.glb')`.
 */
const Assets = {
  /** texto base64 -> bytes crudos. */
  toArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
  },

  /** texto base64 -> una URL que el navegador usa directo. */
  toDataUrl(base64, mimeType) {
    return 'data:' + mimeType + ';base64,' + base64
  },

  /** PNG en base64 */
  loadTexture(base64) {
    return new THREE.TextureLoader().load(Assets.toDataUrl(base64, 'image/png'))
  },

  /** GLB en base64 */
  loadModel(base64) {
    return new Promise((resolve, reject) => {
      new THREE.GLTFLoader().parse(Assets.toArrayBuffer(base64), '', resolve, reject)
    })
  },

  /** WAV o MP3 en base64 -> AudioBuffer, decodificado por la Web Audio API. */
  loadAudio(base64, audioContext) {
    return new Promise((resolve, reject) => {
      // Safari viejito solo acepta callbacks; los navegadores nuevos regresan
      // una promesa. Soportar las dos cuesta dos líneas.
      const maybePromise = audioContext.decodeAudioData(
        Assets.toArrayBuffer(base64),
        resolve,
        reject,
      )
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, reject)
      }
    })
  },
}
