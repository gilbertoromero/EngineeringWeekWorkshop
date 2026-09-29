/**
 * Los shaders del portal, como strings normales.
 *
 * Todo el movimiento sale de UNA textura de ruido (turbulence4.png) que se
 * desplaza con el tiempo.
 */

/** Funciones compartidas por los dos shaders de abajo. */
const PORTAL_SHADER_LIB = /* glsl */ `
  uniform highp float uTime; // highp: el tiempo crece sin parar y en mediump pierde precisión
  uniform sampler2D uNoiseTex;

  // Lee el ruido. Solo usamos el canal rojo: la textura es gris.
  float noise(vec2 uv) {
    return texture2D(uNoiseTex, uv).r;
  }
`

/**
 * VERTEX SHADER — corre una vez por vértice.
 * Su trabajo: decidir dónde cae este vértice en la pantalla (gl_Position) y
 * pasarle al fragment shader lo que necesite (los 'varying').
 */
const PORTAL_VERTEX_SHADER = /* glsl */ `
  uniform float uDisplaceAmp;

  varying vec2 vUv;

  ${PORTAL_SHADER_LIB}

  void main() {
    vUv = uv;

    // La superficie ondula: empujamos cada vértice hacia el frente o hacia
    // atrás según el ruido, que se va desplazando con el tiempo.
    float wobble = noise(uv * 1.2 - uTime * 0.3) - 0.5;
    vec3 transformed = position + normal * wobble * uDisplaceAmp;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

/**
 * FRAGMENT SHADER — corre una vez por cada pixel que cubre el mesh.
 * Su trabajo: decidir el color de ese pixel (gl_FragColor).
 */
const PORTAL_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;
  uniform float uBloom;
  uniform float uSwirlSpeed;
  uniform float uTwist;
  uniform float uInflow;
  uniform float uWarpAmp;
  uniform float uDissolve;
  uniform float uOpen;

  varying vec2 vUv;

  ${PORTAL_SHADER_LIB}

  void main() {
    highp float t = uTime;

    // --- Coordenadas polares ------------------------------------------------
    // En vez de (x, y) medimos cada pixel como (distancia al centro, ángulo).
    // Dividir entre uOpen hace crecer el portal desde el centro.
    vec2 p = (vUv - 0.5) / max(uOpen, 0.001);
    float r = length(p) * 2.0;  // 0 en el centro, 1 en la orilla
    float a = atan(p.y, p.x);   // de -PI a PI

    // --- Remolino -----------------------------------------------------------
    // El ángulo avanza (gira) y el radio retrocede (el dibujo se va hacia
    // dentro). Sumarle r al ángulo tuerce las líneas en espiral.
    highp vec2 swirlUv = vec2(a / 6.2832 + t * uSwirlSpeed + r * uTwist, r - t * uInflow);

    // Turbulencia: dos lecturas del ruido, separadas, forman un vector que
    // empuja las coordenadas. Por eso el remolino no gira "perfecto".
    float wx = noise(vUv * 1.5 + vec2(0.0, -t * 0.15));
    float wy = noise(vUv * 1.5 + vec2(0.5, -t * 0.15));
    swirlUv += (vec2(wx, wy) - 0.5) * 2.0 * uWarpAmp;

    float swirl = noise(swirlUv);

    // Parpadeo: el mismo ruido, más grande y más lento.
    float flicker = 0.85 + 0.15 * noise(vUv * 0.9 - t * 0.07);

    // --- Aro brillante ------------------------------------------------------
    // Una banda alrededor de r = 0.85. El ruido cambia su grosor, así que la
    // orilla parece rasgada en vez de un círculo limpio.
    float thickness = 0.05 + 0.12 * swirl;
    float ring = 1.0 - smoothstep(0.0, thickness, abs(r - 0.85));

    // --- Color por intensidad (rampa de 3 colores) --------------------------
    float intensity = clamp(swirl * smoothstep(0.0, 0.7, r) + ring, 0.0, 1.0) * flicker;
    vec3 color = mix(uColorLow, uColorMid, smoothstep(0.0, 0.5, intensity));
    color = mix(color, uColorHigh, smoothstep(0.5, 1.0, intensity));

    // Centro oscuro que se aclara hacia el aro: el "túnel".
    color = mix(uCoreColor, color, smoothstep(0.0, 0.7, r));

    // --- Disolución con orilla caliente -------------------------------------
    // 'base' se apaga afuera de r = 1 (así nunca se ve el cuadrado del plano).
    // El ruido le muerde la orilla; uDissolve decide qué tanto se come.
    float base = 1.0 - smoothstep(0.9, 1.0, r - swirl * 0.08);
    float carved = base * mix(1.0, swirl, 0.6);
    float alpha = smoothstep(uDissolve, uDissolve + 0.12, carved);
    float edge = smoothstep(uDissolve - 0.06, uDissolve, carved) * (1.0 - alpha);

    color += uEdgeColor * edge;

    // Multiplicar por uBloom pasa el brillo de 1.0: el centro se "quema"
    // como una luz de verdad en vez de quedarse en blanco plano.
    gl_FragColor = vec4(color * uBloom * flicker, max(alpha * (0.35 + 0.65 * intensity), edge));

    // Que three.js aplique su tone mapping y convierta al espacio de color de salida.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
