import {
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Color3,
  Vector3
} from "@babylonjs/core";

/**
 * DamageNumber – Número flotante de daño (GDD HU-08)
 *
 * Criterios de aceptación del GDD:
 *   ✓ Número indicando cantidad de daño sobre el enemigo golpeado
 *   ✓ Desaparece después de unos segundos
 *
 * Implementación: plane billboard con DynamicTexture que escribe el número.
 * Sube flotando y se hace transparente gradualmente.
 */
export class DamageNumber {
  constructor(scene, position, amount) {
    this.scene   = scene;
    this.alive   = true;
    this.lifetime = 1.2; // segundos
    this._timer  = 0;

    // Posición inicial ligeramente arriba del enemigo + offset random X
    const offsetX = (Math.random() - 0.5) * 1.2;
    const startPos = position.clone();
    startPos.x += offsetX;
    startPos.y += 0.8;

    this.startY = startPos.y;
    this.mesh   = MeshBuilder.CreatePlane("dmgNum", { width: 1.2, height: 0.6 }, scene);
    this.mesh.position = startPos;
    this.mesh.billboardMode = 7;

    // Crear textura dinámica con el número
    const texSize = 256;
    const tex = new DynamicTexture("dmgTex_" + Math.random().toString(36).slice(2, 6), texSize, scene);
    tex.hasAlpha = true;

    const ctx = tex.getContext();
    ctx.clearRect(0, 0, texSize, texSize);
    ctx.fillStyle = "#FF3333";
    ctx.font     = "bold 140px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(amount), texSize / 2, texSize / 2);
    tex.update();

    const mat = new StandardMaterial("dmgMat_" + Math.random().toString(36).slice(2, 6), scene);
    mat.diffuseTexture  = tex;
    mat.emissiveColor   = new Color3(1, 0.2, 0.2);
    mat.useAlphaFromDiffuseTexture = true;
    mat.disableLighting = true;
    this.mesh.material  = mat;

    // ─── Loop ───
    this._observer = scene.onBeforeRenderObservable.add(() => this._update());
  }

  _update() {
    if (!this.alive) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this._timer += dt;

    // Subir flotando
    this.mesh.position.y = this.startY + (this._timer / this.lifetime) * 1.5;

    // Transparencia gradual (fade out)
    const alpha = 1 - (this._timer / this.lifetime);
    this.mesh.material.alpha = Math.max(0, alpha);

    if (this._timer >= this.lifetime) {
      this.destroy();
    }
  }

  destroy() {
    this.alive = false;
    this.scene.onBeforeRenderObservable.remove(this._observer);
    if (this.mesh.material && this.mesh.material.diffuseTexture) {
      this.mesh.material.diffuseTexture.dispose();
    }
    this.mesh.material.dispose();
    this.mesh.dispose();
    this.mesh = null;
  }
}