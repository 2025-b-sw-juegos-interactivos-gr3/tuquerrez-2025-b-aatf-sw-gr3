import { Vector3 } from "@babylonjs/core";
import { Projectile } from "./Projectile.js";

/**
 * AutoAttackSystem – GDD HU-02: "Disparo automático al enemigo más cercano"
 *
 * Cada frame busca al enemigo más cercano dentro del radio de ataque.
 * Cuando el cooldown se cumple, instancia un Projectile hacia ese enemigo.
 * El jugador NO presiona botón de atacar (GDD §III.2 "Auto-Battler").
 */
export class AutoAttackSystem {
  constructor(scene, player, gameManager) {
    this.scene       = scene;
    this.player      = player;
    this.gameManager = gameManager;

    // Stats base del arma (mejorables con upgrades)
    this.cooldown   = 0.7;   // segundos entre disparos
    this.range      = 12;    // radio de búsqueda de enemigos
    this.damage     = 10;    // daño por proyectil
    this.projSpeed  = 14;    // velocidad del proyectil

    this._timer  = 0;
    this._active = true;
  }

  update(dt) {
    if (!this._active) return;

    this._timer += dt;
    if (this._timer < this.cooldown) return;
    this._timer = 0;

    // Buscar enemigo más cercano dentro del range
    const target = this.findNearestEnemy();
    if (!target) return;

    // Calcular dirección hacia el target
    const playerPos = this.player.mesh.position;
    const direction = target.mesh.position.subtract(playerPos).normalize();

    // Crear proyectil
    new Projectile(this.scene, playerPos.clone(), direction, this.damage, this.projSpeed, this.gameManager);
  }

  /**
   * Busca el enemigo más cercano dentro de this.range
   */
  findNearestEnemy() {
    const enemies  = this.gameManager.enemies;
    const playerPos = this.player.mesh.position;
    let nearest  = null;
    let nearDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.mesh) continue;

      const dist = Vector3.Distance(playerPos, enemy.mesh.position);
      if (dist < this.range && dist < nearDist) {
        nearest  = enemy;
        nearDist = dist;
      }
    }

    return nearest;
  }

  stop() {
    this._active = false;
  }

  reset() {
    this._active = true;
    this._timer  = 0;
    // Volver a stats base
    this.cooldown  = 0.7;
    this.range     = 12;
    this.damage    = 10;
    this.projSpeed = 14;
  }

  // ─── Métodos para aplicar mejoras desde el UpgradeMenu ───
  applyUpgrade(type) {
    switch (type) {
      case "damage_up":
        this.damage   = Math.floor(this.damage * 1.3);
        break;
      case "cooldown_up":
        this.cooldown = Math.max(0.2, this.cooldown * 0.75);
        break;
      case "range_up":
        this.range += 3;
        break;
    }
  }
}