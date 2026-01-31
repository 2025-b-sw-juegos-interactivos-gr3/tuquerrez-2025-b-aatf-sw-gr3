import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  Texture
} from "@babylonjs/core";

import { XpGem } from "./XpGem.js";
import { DamageNumber } from "./DamageNumber.js";

/**
 * Enemy – entidad poolable (no se destruye, se resetea).
 *
 * Comportamiento:
 *   - Movimiento hacia el jugador (steering)
 *   - Separación entre enemigos (evitan apilarse)
 *   - Flash blanco al recibir daño (GDD HU-08)
 *   - Al morir: suelta gema de XP (GDD HU-04)
 *   - Números flotantes de daño (GDD HU-08)
 */
export class Enemy {
  constructor(scene, gameManager, index) {
    this.scene       = scene;
    this.gameManager = gameManager;

    this.active = false;

    // Stats (se configuran en reset() según config de wave)
    this.maxHealth = 30;
    this.health    = 30;
    this.speed     = 0.035;
    this.xpReward  = 10;

    // Separación entre enemigos
    this.separationRadius = 1.6;
    this.separationForce  = 0.04;

    // Flash de daño
    this._flashTimer = 0;

    // ─── Mesh ───
    this.mesh = MeshBuilder.CreatePlane("enemy_" + index, { size: 1.8 }, scene);
    this.mesh.position.y = 1;
    this.mesh.billboardMode = 7;

    this.mat = new StandardMaterial("enemyMat_" + index, scene);
    this.mat.diffuseTexture = new Texture("/assets/textures/enemy.png", scene);
    this.mat.emissiveColor  = new Color3(0, 0, 0);
    this.mesh.material = this.mat;

    // Desactivado inicialmente (pool)
    this.mesh.setEnabled(false);

    // ─── Loop (siempre activo, pero update verifica this.active) ───
    this._observer = scene.onBeforeRenderObservable.add(() => this._update());
  }

  /**
   * reset() – lo prepara para reutilizar desde el pool.
   * config puede tener: { health, speed, xpReward, spawnRadius }
   */
  reset(player, config = {}) {
    this.player    = player;
    this.maxHealth = config.health    || 30;
    this.health    = this.maxHealth;
    this.speed     = config.speed     || 0.035;
    this.xpReward  = config.xpReward  || 10;

    // Posición de spawn: fuera del campo de visión (GDD HU-03)
    const radius = config.spawnRadius || 14;
    const angle  = Math.random() * Math.PI * 2;
    const playerPos = this.player.mesh.position;
    this.mesh.position.set(
      playerPos.x + Math.cos(angle) * radius,
      1,
      playerPos.z + Math.sin(angle) * radius
    );

    this._flashTimer = 0;
    this.mat.emissiveColor.set(0, 0, 0);
  }

  // ============================================================
  // UPDATE
  // ============================================================
  _update() {
    if (!this.active) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    // ─── Movimiento hacia jugador ───
    const toPlayer = this.player.mesh.position
      .subtract(this.mesh.position)
      .normalize();

    // ─── Separación entre enemigos ───
    const separation = this.getSeparationVector();

    // ─── Vector final combinado ───
    const movement = toPlayer
      .add(separation.scale(1.2))
      .normalize()
      .scale(this.speed);

    this.mesh.position.addInPlace(movement);

    // ─── Flash de daño ───
    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer <= 0) {
        this.mat.emissiveColor.set(0, 0, 0);
      }
    }
  }

  getSeparationVector() {
    const enemies = this.gameManager.enemies;
    let force = Vector3.Zero();

    for (const other of enemies) {
      if (other === this || !other.active) continue;

      const dist = Vector3.Distance(this.mesh.position, other.mesh.position);
      if (dist < this.separationRadius && dist > 0.01) {
        const pushAway = this.mesh.position
          .subtract(other.mesh.position)
          .normalize()
          .scale(this.separationForce / dist);
        force.addInPlace(pushAway);
      }
    }

    return force;
  }

  // ============================================================
  // DAÑO & MUERTE
  // ============================================================
  takeDamage(amount) {
    if (!this.active) return;

    this.health -= amount;

    // Flash blanco (GDD HU-08: "parpadear flash blanco")
    this.mat.emissiveColor.set(1, 1, 1);
    this._flashTimer = 0.1;

    // Número flotante de daño (GDD HU-08)
    new DamageNumber(this.scene, this.mesh.position.clone(), Math.floor(amount));

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    // Suelta gema de XP (GDD §III.1 "Feedback: Enemigo muere → Suelta Gema de XP")
    new XpGem(this.scene, this.mesh.position.clone(), this.xpReward, this.gameManager);

    // Devolver al pool (no dispose, solo desactivar)
    this.gameManager.removeEnemy(this);
  }
}