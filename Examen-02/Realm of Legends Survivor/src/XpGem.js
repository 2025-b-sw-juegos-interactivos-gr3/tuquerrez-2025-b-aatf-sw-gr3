import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3
} from "@babylonjs/core";

/**
 * XpGem – Gema de experiencia que suelta el enemigo al morir.
 *
 * GDD §III.1 Core Loop:
 *   "Feedback: Enemigo muere → Suelta Gema de XP"
 *   "Recolección: Jugador recoge gema → Barra de XP sube"
 *
 * Se auto-recolecta cuando el jugador entra dentro de un radio de atracción.
 * Tiene un lifetime máximo (desaparece si no se recoge).
 * Pequeña animación de "float" para ser más visible.
 */
export class XpGem {
  constructor(scene, position, xpAmount, gameManager) {
    this.scene       = scene;
    this.gameManager = gameManager;
    this.xpAmount   = xpAmount;
    this.alive      = true;
    this.lifetime   = 12; // segundos antes de desaparecer
    this._timer     = 0;
    this._baseY     = position.y;
    this._floatPhase = Math.random() * Math.PI * 2; // fase aleatoria para float

    // Radio de recolección automática
    this.collectRadius = 2.5;

    // ─── Mesh: esfera pequeña (forma de gema) ───
    this.mesh = MeshBuilder.CreateSphere("xpGem", { diameter: 0.45 }, scene);
    this.mesh.position = position.clone();
    this.mesh.position.y = 0.5;

    const mat = new StandardMaterial("xpGemMat_" + Math.random().toString(36).slice(2, 6), scene);
    mat.emissiveColor   = new Color3(0.2, 0.9, 0.3); // verde brillante
    mat.disableLighting = true;
    this.mesh.material  = mat;

    // ─── Loop ───
    this._observer = scene.onBeforeRenderObservable.add(() => this._update());
  }

  _update() {
    if (!this.alive) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this._timer += dt;

    // Float animación
    this._floatPhase += dt * 4;
    this.mesh.position.y = 0.5 + Math.sin(this._floatPhase) * 0.15;

    // Rotación
    this.mesh.rotation.y += dt * 3;

    // Timeout
    if (this._timer > this.lifetime) {
      this.destroy();
      return;
    }

    // Parpadeo al estar cerca de desaparecer
    if (this._timer > this.lifetime - 3) {
      const blink = Math.sin(this._timer * 15) > 0;
      this.mesh.setEnabled(blink);
    }

    // ─── Recolección automática ───
    const player = this.gameManager.player;
    const dist   = Vector3.Distance(this.mesh.position, player.mesh.position);
    if (dist < this.collectRadius) {
      this.collect();
    }
  }

  collect() {
    // Dar XP al jugador
    this.gameManager.player.gainXp(this.xpAmount);
    this.destroy();
  }

  destroy() {
    this.alive = false;
    this.scene.onBeforeRenderObservable.remove(this._observer);
    this.mesh.dispose();
    this.mesh = null;
  }
}