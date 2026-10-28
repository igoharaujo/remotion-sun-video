// The 3D layer, Apple Keynote studio: charcoal cyclorama, glossy dark floor far below, soft cool key
// light, and the field of floating browser windows (one instanced mesh, sorted back-to-front each frame).
// Every value is a pure function of the frame.
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { BLUE, FPS, H, K, STAGE, SPOT, W, SC, blackoutAt, dimAt, hookDarkAt, kickAt, prog, win } from "../tl";
import { makeAtlas } from "./atlas";
import { FOV, N_TOTAL, WIN, cameraAt, focusAt, lookAtFor, windowAt } from "./field";
import { BLUR_FRAG, DOF_COMPOSITE_FRAG, FLOOR_FRAG, FLOOR_VERT, GLOW_FRAG, QUAD_VERT, SCREEN_VERT, STAGE_FRAG, WINDOW_FRAG, WINDOW_VERT } from "./shaders";

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

const useShader = (frag: string, vert: string, uniforms: Record<string, THREE.IUniform>, extra: object = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, ...extra }), []);

/** Impact frames that kick the key light. */
const FLARES = [K("S01", "n47"), K("S01", "problema"), K("S03", "multiply"), K("S06", "windows"), K("S07", "zoologico")];
export const flareAt = (frame: number) => FLARES.reduce((m, f) => Math.max(m, kickAt(frame, f, 14)), 0);
const darkAt = (frame: number) => Math.max(hookDarkAt(frame), blackoutAt(frame));

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(lookAtFor(frame));
  camera.updateProjectionMatrix();
  return null;
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(
    STAGE_FRAG,
    SCREEN_VERT,
    { uDark: { value: 1 }, uDim: { value: 0 }, uGlow: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.58) }, uTint: { value: new THREE.Color(SPOT) }, uTime: { value: 0 } },
    { depthWrite: false, depthTest: false },
  );
  mat.uniforms.uDark.value = darkAt(frame);
  mat.uniforms.uDim.value = dimAt(frame);
  mat.uniforms.uGlow.value = 0.75 + 0.35 * flareAt(frame);
  mat.uniforms.uTime.value = frame / FPS;
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

const FLOOR_Y = -4.6;
const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(FLOOR_FRAG, FLOOR_VERT, {
    uPool: { value: new THREE.Vector3(0, FLOOR_Y, -6) },
    uPoolK: { value: 0 },
    uTint: { value: new THREE.Color(SPOT) },
    uDark: { value: 1 },
    uDim: { value: 0 },
    uCam: { value: new THREE.Vector3() },
  });
  const c = cameraAt(frame);
  mat.uniforms.uPool.value.set(c.x, FLOOR_Y, -6);
  mat.uniforms.uPoolK.value = 0.7 + 0.4 * flareAt(frame);
  mat.uniforms.uDark.value = darkAt(frame);
  mat.uniforms.uDim.value = dimAt(frame);
  mat.uniforms.uCam.value.set(c.x, c.y, c.z);
  return (
    <mesh material={mat} position={[0, FLOOR_Y, -20]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-9}>
      <planeGeometry args={[90, 90]} />
    </mesh>
  );
};

export const SoftGlow: React.FC<{ position: THREE.Vector3; size: number; color: string; intensity: number; falloff?: number }> = ({ position, size, color, intensity, falloff = 6 }) => {
  const mat = useShader(GLOW_FRAG, QUAD_VERT, { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uFalloff: { value: falloff } }, additive);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uIntensity.value = intensity;
  if (intensity <= 0.002) return null;
  return (
    <mesh position={position} material={mat} renderOrder={1}>
      <planeGeometry args={[size * 1.6, size]} />
    </mesh>
  );
};

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();

const Windows: React.FC = () => {
  const frame = useCurrentFrame();
  const atlas = useMemo(makeAtlas, []);
  const { mesh, attrs } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(WIN.w + 2 * WIN.margin, WIN.h + 2 * WIN.margin);
    const names = ["aCell", "aAlpha", "aHi", "aGrey", "aBlank"] as const;
    const a = Object.fromEntries(names.map((n) => [n, new THREE.InstancedBufferAttribute(new Float32Array(N_TOTAL), 1)])) as Record<(typeof names)[number], THREE.InstancedBufferAttribute>;
    names.forEach((n) => geom.setAttribute(n, a[n]));
    const mat = new THREE.ShaderMaterial({
      vertexShader: WINDOW_VERT,
      fragmentShader: WINDOW_FRAG,
      uniforms: {
        uAtlas: { value: atlas },
        uSize: { value: new THREE.Vector2(WIN.w, WIN.h) },
        uMargin: { value: WIN.margin },
        uStage: { value: new THREE.Color(STAGE) },
        uBlue: { value: new THREE.Color(BLUE) },
        uFogNear: { value: 9 },
        uFogFar: { value: 26 },
        uDark: { value: 1 },
        uFocus: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    const m = new THREE.InstancedMesh(geom, mat, N_TOTAL);
    m.frustumCulled = false;
    m.renderOrder = 2;
    return { mesh: m, attrs: a };
  }, [atlas]);

  const c = cameraAt(frame);
  const camPos = new THREE.Vector3(c.x, c.y, c.z);
  // Back-to-front so the glass blends correctly (instances draw in buffer order).
  const states = Array.from({ length: N_TOTAL }, (_, i) => windowAt(i, frame))
    .filter((s) => s.alpha > 0.002 && s.scale > 0.002)
    .map((s) => ({ s, d: s.pos.distanceToSquared(camPos) }))
    .sort((a, b) => b.d - a.d);
  states.forEach(({ s }, n) => {
    tmpQ.setFromEuler(s.rot);
    tmpS.setScalar(s.scale);
    tmpM.compose(s.pos, tmpQ, tmpS);
    mesh.setMatrixAt(n, tmpM);
    attrs.aCell.setX(n, s.cell);
    attrs.aAlpha.setX(n, s.alpha);
    attrs.aHi.setX(n, s.hi);
    attrs.aGrey.setX(n, s.grey);
    attrs.aBlank.setX(n, s.blank);
  });
  mesh.count = states.length;
  mesh.instanceMatrix.needsUpdate = true;
  Object.values(attrs).forEach((a) => (a.needsUpdate = true));
  const mat = mesh.material as THREE.ShaderMaterial;
  mat.uniforms.uDark.value = darkAt(frame);
  // Background panes sit a little back from the type at all times; heroes and lights-down push them further.
  mat.uniforms.uFocus.value = Math.max(focusAt(frame), 0.75 * dimAt(frame), 0.3 * prog(frame, K("S01", "problema"), K("S01", "problema") + 40), 0.85 * win(frame, SC.S06.from, K("S07", "enquanto") + 6, 20, 10));
  // Fog travels with the camera, so the zoo pull-back keeps the far wall of windows readable.
  mat.uniforms.uFogNear.value = 9 + Math.max(0, c.z - 10);
  mat.uniforms.uFogFar.value = 26 + Math.max(0, c.z - 10) * 1.4;

  // Chrome-blue halo light behind the most highlighted window.
  const hero = states.reduce<(typeof states)[number] | null>((m, x) => (x.s.hi > (m?.s.hi ?? 0.25) ? x : m), null);
  return (
    <>
      {hero ? <SoftGlow position={hero.s.pos.clone().add(new THREE.Vector3(0, 0, -0.4))} size={2.6 * hero.s.scale} color={BLUE} intensity={0.32 * hero.s.hi * hero.s.alpha} /> : null}
      <primitive object={mesh} />
    </>
  );
};

/** Depth of field: 0..1 defocus of everything behind the mascot (0 = plain render). */
export type Dof = { amount: number };

/** Objects under a group named this render sharp, on top of the defocused field. */
export const FOCUS_NAME = "dof-focus";
const FOCUS_LAYER = 1;
const BLUR_PASSES = 3;

/**
 * Layered depth of field, rendered by hand after each frame advance (the postprocessing
 * EffectComposer outputs black under Remotion's headless renderer). Pass 1: the field (layer 0) into
 * a multisampled target. Pass 2: separable Gaussian at half resolution, radius growing with `amount`.
 * Pass 3: sharp/blurred mix to the screen. Pass 4: the in-focus subject (layer 1) drawn sharp on top (also without defocus).
 */
const DofRenderer: React.FC<{ dof: Dof }> = ({ dof }) => {
  const { gl, scene, camera, size } = useThree();
  const res = useMemo(() => {
    const w = Math.round(size.width);
    const h = Math.round(size.height);
    const sharp = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
    const half = () => new THREE.WebGLRenderTarget(Math.round(w / 2), Math.round(h / 2), { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const blurA = half();
    const blurB = half();
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadVert = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const blur = new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader: BLUR_FRAG, uniforms: { uTex: { value: null }, uDir: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
    const comp = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: DOF_COMPOSITE_FRAG,
      uniforms: { uSharp: { value: sharp.texture }, uBlur: { value: blurA.texture }, uAmount: { value: 0 } },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur);
    quad.frustumCulled = false;
    const quadScene = new THREE.Scene();
    quadScene.add(quad);
    return { w, h, sharp, blurA, blurB, quadCam, blur, comp, quad, quadScene };
  }, [size.width, size.height]);

  useFrame(() => {
    const focus = scene.getObjectByName(FOCUS_NAME);
    focus?.traverse((o) => o.layers.set(FOCUS_LAYER));
    const amount = Math.max(0, Math.min(1, dof.amount));
    const prevAuto = gl.autoClear;
    if (amount < 0.002) {
      // No defocus: the field straight to the screen, the subject still drawn last so the glass panes never veil it.
      camera.layers.set(0);
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      gl.autoClear = false;
      gl.clearDepth();
      camera.layers.set(FOCUS_LAYER);
      gl.render(scene, camera);
      gl.autoClear = prevAuto;
      camera.layers.enableAll();
      return;
    }
    // 1. the field, sharp
    camera.layers.set(0);
    gl.setRenderTarget(res.sharp);
    gl.clear();
    gl.render(scene, camera);
    // 2. blur at half resolution (radius in half-res texels grows with the defocus)
    const radius = 0.6 + 3.2 * amount;
    res.quad.material = res.blur;
    let src: THREE.Texture = res.sharp.texture;
    for (let i = 0; i < BLUR_PASSES; i++) {
      res.blur.uniforms.uTex.value = src;
      res.blur.uniforms.uDir.value.set((radius * (i + 1)) / (res.w / 2), 0);
      gl.setRenderTarget(res.blurB);
      gl.render(res.quadScene, res.quadCam);
      res.blur.uniforms.uTex.value = res.blurB.texture;
      res.blur.uniforms.uDir.value.set(0, (radius * (i + 1)) / (res.h / 2));
      gl.setRenderTarget(res.blurA);
      gl.render(res.quadScene, res.quadCam);
      src = res.blurA.texture;
    }
    // 3. composite to the screen
    res.comp.uniforms.uAmount.value = Math.min(1, amount * 1.6);
    res.quad.material = res.comp;
    gl.setRenderTarget(null);
    gl.render(res.quadScene, res.quadCam);
    // 4. the subject, sharp, over it
    gl.autoClear = false;
    gl.clearDepth();
    camera.layers.set(FOCUS_LAYER);
    gl.render(scene, camera);
    gl.autoClear = prevAuto;
    camera.layers.enableAll();
  }, 1);
  return null;
};

export const Scene3D: React.FC<{ children?: React.ReactNode; dof?: Dof }> = ({ children, dof }) => (
  <ThreeCanvas width={Math.round(W)} height={Math.round(H)} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 400 }}>
    <CameraRig />
    <Backdrop />
    <Floor />
    <Windows />
    {children}
    {dof ? <DofRenderer dof={dof} /> : null}
  </ThreeCanvas>
);
