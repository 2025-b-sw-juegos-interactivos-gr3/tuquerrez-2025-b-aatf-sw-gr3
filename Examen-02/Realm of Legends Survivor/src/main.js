import "@babylonjs/loaders";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  Color4
} from "@babylonjs/core";

import { GameManager } from "./GameManager.js";
import { GroundSystem } from "./GroundSystem.js";
import { HUD } from "./HUD.js";
import "@babylonjs/loaders";

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

// ─── IIFE async: necesaria porque GameManager.getInstance() es async
//     (tiene que await-ear la carga de los modelos .glb antes de construir
//      al Player y al EnemyPool) ───
(async () => {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.1, 0.12, 0.18, 1);

  // ─── Cámara isométrica fija (GDD §V - top-down) ───
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,
    Math.PI / 3.2,
    22,
    Vector3.Zero(),
    scene
  );
  camera.lowerRadiusLimit = 22;
  camera.upperRadiusLimit = 22;
  camera.lowerBetaLimit  = Math.PI / 3.2;
  camera.upperBetaLimit  = Math.PI / 3.2;

  // ─── Iluminación ───
  new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
  dirLight.diffuse   = new Color3(1, 0.95, 0.85);
  dirLight.intensity = 0.6;

  // ─── Ground infinito (tiling, GDD §V.1) ───
  new GroundSystem(scene);

  // ─── HUD ───
  const hud = new HUD();

  // ─── GameManager Singleton (async: carga .glb internamente) ───
  await GameManager.getInstance(scene, camera, hud);

  // ─── Loop ───
  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
})();