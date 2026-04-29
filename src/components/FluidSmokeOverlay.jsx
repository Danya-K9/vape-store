import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const CLEAR_SHADER = `
precision mediump float;
uniform vec4 color;
void main () {
  gl_FragColor = color;
}
`;

const SPLAT_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

const ADVECTION_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
  gl_FragColor.a = 1.0;
}
`;

const DIVERGENCE_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const CURL_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

const VORTICITY_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
}
`;

const PRESSURE_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_SUB_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const DISPLAY_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTexture;
void main () {
  vec3 C = texture2D(uTexture, vUv).rgb;
  float d = max(C.r, max(C.g, C.b));

  // d в нашей симуляции довольно маленький (0..~0.05).
  // Делаем тёмно-серый дым + светлые белые блики.
  float t = smoothstep(0.010, 0.040, d);
  float t2 = pow(t, 1.7);

  vec3 base = vec3(0.02);     // чёрный дым
  vec3 mid = vec3(0.18);     // серый
  vec3 hi = vec3(0.92);      // белые отенки

  vec3 smoke = mix(base, mid, t2);
  smoke = mix(smoke, hi, pow(t, 6.0) * 0.85);

  // Альфа контролирует “густоту” дыма.
  float a = clamp(t * 0.85, 0.0, 1.0);
  gl_FragColor = vec4(smoke, a);
}
`;

const BLUR_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uTexture;
void main () {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vL);
  sum += texture2D(uTexture, vR);
  sum += texture2D(uTexture, vT);
  sum += texture2D(uTexture, vB);
  gl_FragColor = sum * 0.25;
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}

function createFBO(gl, w, h, internalFormat, format, type, filter) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return { texture, fbo, width: w, height: h };
}

function createDoubleFBO(gl, w, h, internalFormat, format, type, filter) {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    get read() { return fbo1; },
    get write() { return fbo2; },
    swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
  };
}

export default function FluidSmokeOverlay({ className = 'fluid-smoke-overlay' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return undefined;

    // ARMA хранит координаты в пикселях (от верхнего-левого угла canvas),
    // а в shader передаёт normalized point (x/width, 1-y/height).
    const pointers = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      moved: false,
      color: [0.010, 0.010, 0.010], // темный "дым" (eU() в ARMA, но темнее для белого сайта)
    };
    const texType = gl.UNSIGNED_BYTE;
    const texFormat = gl.RGBA;
    const filtering = gl.LINEAR;

    const baseVertex = VERTEX_SHADER;
    const programs = {
      clear: createProgram(gl, baseVertex, CLEAR_SHADER),
      splat: createProgram(gl, baseVertex, SPLAT_SHADER),
      advection: createProgram(gl, baseVertex, ADVECTION_SHADER),
      divergence: createProgram(gl, baseVertex, DIVERGENCE_SHADER),
      curl: createProgram(gl, baseVertex, CURL_SHADER),
      vorticity: createProgram(gl, baseVertex, VORTICITY_SHADER),
      pressure: createProgram(gl, baseVertex, PRESSURE_SHADER),
      gradSub: createProgram(gl, baseVertex, GRADIENT_SUB_SHADER),
      display: createProgram(gl, baseVertex, DISPLAY_SHADER),
      blur: createProgram(gl, baseVertex, BLUR_SHADER),
    };

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    let velocity;
    let density;
    let divergence;
    let curl;
    let pressure;
    let simWidth = 0;
    let simHeight = 0;
    let cssWidth = 1;
    let cssHeight = 1;
    // Под белый фон чуть меньше радиус, чтобы не выглядело "кругами".
    const cachedSplatRadius = 0.3 / 180;
    let rafId = 0;
    let lastTime = performance.now();

    const getTexel = (fbo) => [1 / fbo.width, 1 / fbo.height];

    const bindAttrib = (program) => {
      const loc = gl.getAttribLocation(program, 'aPosition');
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const blit = (target) => {
      const isDefault = !target;
      gl.bindFramebuffer(gl.FRAMEBUFFER, isDefault ? null : target.fbo);
      gl.viewport(0, 0, isDefault ? canvas.width : target.width, isDefault ? canvas.height : target.height);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const rect = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      pointers.x = cssWidth / 2;
      pointers.y = cssHeight / 2;
      canvas.width = Math.max(2, Math.floor(rect.width * dpr));
      canvas.height = Math.max(2, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);

      simWidth = Math.max(96, Math.floor(canvas.width / 1.5));
      simHeight = Math.max(96, Math.floor(canvas.height / 1.5));
      velocity = createDoubleFBO(gl, simWidth, simHeight, texFormat, texFormat, texType, filtering);
      density = createDoubleFBO(gl, simWidth, simHeight, texFormat, texFormat, texType, filtering);
      divergence = createFBO(gl, simWidth, simHeight, texFormat, texFormat, texType, gl.NEAREST);
      curl = createFBO(gl, simWidth, simHeight, texFormat, texFormat, texType, gl.NEAREST);
      pressure = createDoubleFBO(gl, simWidth, simHeight, texFormat, texFormat, texType, gl.NEAREST);

      // IMPORTANT: clear all simulation buffers.
      // Without this, uninitialized GPU textures can cause flickering/garbage frames.
      const clearTo = (targetFbo, rgba) => {
        gl.useProgram(programs.clear);
        bindAttrib(programs.clear);
        gl.uniform4f(gl.getUniformLocation(programs.clear, 'color'), rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo.fbo);
        gl.viewport(0, 0, targetFbo.width, targetFbo.height);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      };

      // velocity/density/pressure are double FBOs
      clearTo(velocity.read, [0, 0, 0, 1]);
      clearTo(velocity.write, [0, 0, 0, 1]);
      clearTo(density.read, [0, 0, 0, 1]);
      clearTo(density.write, [0, 0, 0, 1]);
      clearTo(pressure.read, [0, 0, 0, 1]);
      clearTo(pressure.write, [0, 0, 0, 1]);

      // single FBOs
      clearTo(divergence, [0, 0, 0, 1]);
      clearTo(curl, [0, 0, 0, 1]);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      pointers.dx = 1.5 * (x - pointers.x);
      pointers.dy = 1.5 * (y - pointers.y);
      pointers.x = x;
      pointers.y = y;

      // Темный пар под белый фон.
      const gray = 0.006 + Math.random() * 0.016;
      pointers.color = [gray, gray, gray];
      pointers.moved = true;
    };

    const setTexel = (program, fbo) => {
      const texelLoc = gl.getUniformLocation(program, 'texelSize');
      const [tx, ty] = getTexel(fbo);
      gl.uniform2f(texelLoc, tx, ty);
    };

    const splat = (x, y, dx, dy, color, radius = cachedSplatRadius) => {
      gl.useProgram(programs.splat);
      bindAttrib(programs.splat);

      setTexel(programs.splat, velocity.read);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'aspectRatio'), cssWidth / cssHeight);
      // Screen coords (x,y) are top-left origin; convert to vUv coords (bottom-left origin, 0..1).
      gl.uniform2f(
        gl.getUniformLocation(programs.splat, 'point'),
        x / cssWidth,
        1 - y / cssHeight
      );
      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), dx, -dy, 1);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'radius'), radius);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.splat, 'uTarget'), 0);
      blit(velocity.write);
      velocity.swap();

      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), color[0], color[1], color[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      blit(density.write);
      density.swap();
    };

    const emitPlume = (x, y, dx, dy, baseColor) => {
      // Create several offset splats to avoid "round blob" look.
      const speed = Math.hypot(dx, dy);
      const strength = Math.max(0.7, Math.min(2.4, speed / 10));
      for (let i = 0; i < 4; i += 1) {
        const jitterX = (Math.random() - 0.5) * 26;
        const jitterY = (Math.random() - 0.5) * 26;
        const swirlX = dx * (0.55 + Math.random() * 0.5) + (Math.random() - 0.5) * 20;
        const swirlY = dy * (0.55 + Math.random() * 0.5) + (Math.random() - 0.5) * 20;
        const gray = Math.max(0.003, Math.min(0.03, baseColor[0] * (0.85 + Math.random() * 0.55)));
        splat(
          x + jitterX,
          y + jitterY,
          swirlX * strength,
          swirlY * strength,
          [gray, gray, gray],
          cachedSplatRadius * (0.55 + Math.random() * 0.9)
        );
      }
    };

    const step = (dt) => {
      gl.disable(gl.BLEND);

      gl.useProgram(programs.curl);
      bindAttrib(programs.curl);
      setTexel(programs.curl, velocity.read);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.curl, 'uVelocity'), 0);
      blit(curl);

      gl.useProgram(programs.vorticity);
      bindAttrib(programs.vorticity);
      setTexel(programs.vorticity, velocity.read);
      gl.uniform1f(gl.getUniformLocation(programs.vorticity, 'curl'), 22.0);
      gl.uniform1f(gl.getUniformLocation(programs.vorticity, 'dt'), dt);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.vorticity, 'uVelocity'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curl.texture);
      gl.uniform1i(gl.getUniformLocation(programs.vorticity, 'uCurl'), 1);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.divergence);
      bindAttrib(programs.divergence);
      setTexel(programs.divergence, velocity.read);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.divergence, 'uVelocity'), 0);
      blit(divergence);

      gl.useProgram(programs.clear);
      bindAttrib(programs.clear);
      gl.uniform4f(gl.getUniformLocation(programs.clear, 'color'), 0, 0, 0, 1);
      blit(pressure.write);
      pressure.swap();

      gl.useProgram(programs.pressure);
      bindAttrib(programs.pressure);
      setTexel(programs.pressure, pressure.read);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(gl.getUniformLocation(programs.pressure, 'uPressure'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergence.texture);
      gl.uniform1i(gl.getUniformLocation(programs.pressure, 'uDivergence'), 1);
      for (let i = 0; i < 15; i += 1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
        blit(pressure.write);
        pressure.swap();
      }

      gl.useProgram(programs.gradSub);
      bindAttrib(programs.gradSub);
      setTexel(programs.gradSub, velocity.read);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.gradSub, 'uPressure'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.gradSub, 'uVelocity'), 1);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(programs.advection);
      bindAttrib(programs.advection);
      setTexel(programs.advection, velocity.read);
      gl.uniform1f(gl.getUniformLocation(programs.advection, 'dt'), dt);
      gl.uniform1f(gl.getUniformLocation(programs.advection, 'dissipation'), 0.986);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.advection, 'uVelocity'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.advection, 'uSource'), 1);
      blit(velocity.write);
      velocity.swap();

      setTexel(programs.advection, density.read);
      gl.uniform1f(gl.getUniformLocation(programs.advection, 'dissipation'), 0.955);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      blit(density.write);
      density.swap();

      // Soften "circle" artifacts in splats to look more like vapor wisps.
      gl.useProgram(programs.blur);
      bindAttrib(programs.blur);
      setTexel(programs.blur, density.read);
      gl.uniform1i(gl.getUniformLocation(programs.blur, 'uTexture'), 0);
      for (let i = 0; i < 1; i += 1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
        blit(density.write);
        density.swap();
      }
    };

    const render = () => {
      // Always clear frame first so smoke doesn't accumulate visually on page.
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Smoke overlay should be alpha-blended, not opaque-override.
      gl.enable(gl.BLEND);
      // Для белого сайта НЕ используем additive (ONE,ONE),
      // иначе дым быстро превращается в белые пятна.
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(programs.display);
      bindAttrib(programs.display);
      setTexel(programs.display, density.read);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, density.read.texture);
      gl.uniform1i(gl.getUniformLocation(programs.display, 'uTexture'), 0);
      blit(null);
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.016);
      lastTime = now;

      if (pointers.moved) {
        emitPlume(pointers.x, pointers.y, pointers.dx, pointers.dy, pointers.color);
        pointers.moved = false;
        pointers.dx = 0;
        pointers.dy = 0;
      }

      step(dt);
      render();
      rafId = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

