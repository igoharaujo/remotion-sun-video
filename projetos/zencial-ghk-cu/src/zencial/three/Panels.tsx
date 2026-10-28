// Small self-contained WebGL panel placed in the 2D layout: the generic yellow 3D cart (no logo).
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import { CART_YELLOW } from "../tl";
import { ATOM_FRAG, ATOM_VERT } from "./shaders";

// ---- generic yellow shopping cart (no logo) -----------------------------------------------------
const litMat = (color: string, metal: number) =>
  new THREE.ShaderMaterial({
    vertexShader: ATOM_VERT,
    fragmentShader: ATOM_FRAG,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uMetal: { value: metal }, uGlow: { value: 0 } },
  });

const tube = (pts: [number, number, number][], r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0), 48, r, 10, false);

const CartModel: React.FC<{ yaw: number; bounce: number }> = ({ yaw, bounce }) => {
  const parts = useMemo(() => {
    // Basket: trapezoid frame (wider at top), handle bar to the left, wire grid on the front.
    const top: [number, number, number][] = [
      [-1.1, 0.75, 0.55],
      [1.25, 0.75, 0.55],
      [1.25, 0.75, -0.55],
      [-1.1, 0.75, -0.55],
      [-1.1, 0.75, 0.55],
    ];
    const bottom: [number, number, number][] = [
      [-0.8, -0.35, 0.42],
      [1.0, -0.35, 0.42],
      [1.0, -0.35, -0.42],
      [-0.8, -0.35, -0.42],
      [-0.8, -0.35, 0.42],
    ];
    const frame = [tube(top, 0.07), tube(bottom, 0.07)];
    const posts = [0, 1, 2, 3].map((i) => tube([top[i], bottom[i]], 0.06));
    const grid = [0.25, 0.5, 0.75].map((u) => tube([[mix3(-1.1, -0.8, 0), mix3(0.75, -0.35, u), 0.5], [mix3(1.25, 1.0, 0), mix3(0.75, -0.35, u), 0.5]], 0.035));
    const vgrid = [-0.5, 0.1, 0.7].map((x) => tube([[x, 0.75, 0.53], [x * 0.85, -0.35, 0.43]], 0.035));
    const handle = [tube([[-1.1, 0.75, 0.55], [-1.55, 1.25, 0.55]], 0.07), tube([[-1.1, 0.75, -0.55], [-1.55, 1.25, -0.55]], 0.07), tube([[-1.55, 1.25, 0.6], [-1.55, 1.25, -0.6]], 0.09)];
    const base = [tube([[-0.8, -0.35, 0], [-0.9, -0.75, 0], [1.1, -0.75, 0]], 0.06)];
    return { yellow: [...frame, ...posts, ...grid, ...vgrid, ...handle, ...base] };
  }, []);
  const yellow = useMemo(() => litMat(CART_YELLOW, 0.5), []);
  const wheel = useMemo(() => litMat("#3A2A1A", 0.6), []);
  const wheelG = useMemo(() => new THREE.TorusGeometry(0.17, 0.08, 12, 24), []);
  return (
    <group rotation={[0.28, yaw, 0]} position={[0.1, bounce * 0.25, 0]}>
      {parts.yellow.map((g, i) => (
        <mesh key={i} geometry={g} material={yellow} />
      ))}
      {[
        [-0.55, -0.95, 0.35],
        [0.85, -0.95, 0.35],
        [-0.55, -0.95, -0.35],
        [0.85, -0.95, -0.35],
      ].map((p, i) => (
        <mesh key={i} geometry={wheelG} material={wheel} position={p as [number, number, number]} />
      ))}
    </group>
  );
};
const mix3 = (a: number, b: number, t: number) => a + (b - a) * t;

/** The cart icon rendered into a size×size box; `yaw` swings it, `bounce` lifts it on a pop. */
export const Cart3D: React.FC<{ size: number; yaw: number; bounce: number }> = ({ size, yaw, bounce }) => (
  <ThreeCanvas width={Math.round(size)} height={Math.round(size)} flat linear gl={{ antialias: true }} camera={{ fov: 32, position: [0, 0.4, 6.2] }}>
    <CartModel yaw={yaw} bounce={bounce} />
  </ThreeCanvas>
);
