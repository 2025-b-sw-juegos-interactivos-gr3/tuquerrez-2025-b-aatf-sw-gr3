import {
  MeshBuilder,
  StandardMaterial,
  Texture,
  Vector3
} from "@babylonjs/core";

/**
 * GroundSystem – Ground infinito con tiling (GDD §V.1)
 *
 * GDD: "Un plano infinito que se genera proceduralmente alrededor del jugador.
 *       Tilemap Loop. El suelo es una textura que se repite."
 *
 * Implementación: un solo plano grande que se mueve junto a la cámara.
 * La textura se setea con wrapMode REPEAT para dar la ilusión de infinito.
 */
export class GroundSystem {
  constructor(scene) {
    this.scene = scene;

    // Plano grande de ground
    this.ground = MeshBuilder.CreateGround("ground", {
      width:          80,
      height:         80,
      subdivisions:   1
    }, scene);

    this.ground.position.y = 0;

    // Material con textura repetida
    const mat = new StandardMaterial("groundMat", scene);

    // Si hay textura disponible, usarla; sino usar color sólido
    try {
      const tex = new Texture("/assets/textures/ground.jpg", scene);
      tex.uScale = 8; // repetir la textura 8x en cada eje
      tex.vScale = 8;
      mat.diffuseTexture = tex;
    } catch (e) {
      // Fallback: color verde oscuro si no hay textura
      mat.diffuseColor = new Color3(0.2, 0.25, 0.15);
    }

    mat.specularColor.set(0, 0, 0); // sin brillo especular

    this.ground.material = mat;

    // Seguir a la cámara cada frame
    this._observer = scene.onBeforeRenderObservable.add(() => {
      const cam = scene.activeCamera;
      if (cam && cam.target) {
        // Mover el ground para que siempre esté centrado en la cámara
        this.ground.position.x = cam.target.x;
        this.ground.position.z = cam.target.z;
      }
    });
  }
}