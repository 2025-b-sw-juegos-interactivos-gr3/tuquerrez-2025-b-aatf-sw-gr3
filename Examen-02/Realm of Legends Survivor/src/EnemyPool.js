import {
  MeshBuilder,
  StandardMaterial,
  Color3
} from "@babylonjs/core";

import { Enemy } from "./Enemy.js";

/**
 * EnemyPool – Object Pooling (GDD §VII.3, HU-03)
 *
 * Pre-crea N enemigos inactivos. Al necesitar uno → acquire() lo activa.
 * Al morir → release() lo desactiva y lo vuelve a meter en la piscina.
 * Evita Instantiate/Destroy masivo que mata el rendimiento con 500+ enemigos.
 */
export class EnemyPool {
  constructor(scene, gameManager, poolSize = 80) {
    this.scene       = scene;
    this.gameManager = gameManager;

    this.pool   = []; // todos los enemigos (activos e inactivos)
    this.free   = []; // stack de enemigos libres (inactivos)

    // Pre-crear la piscina
    for (let i = 0; i < poolSize; i++) {
      const enemy = new Enemy(scene, gameManager, i);
      enemy.active = false;
      enemy.mesh.setEnabled(false);
      this.pool.push(enemy);
      this.free.push(enemy);
    }
  }

  /**
   * Devuelve un enemigo libre y lo marca como activo.
   * Retorna null si la piscina está agotada.
   */
  acquire() {
    if (this.free.length === 0) return null;
    const enemy = this.free.pop();
    enemy.active = true;
    enemy.mesh.setEnabled(true);
    return enemy;
  }

  /**
   * Devuelve un enemigo a la piscina (lo desactiva).
   */
  release(enemy) {
    enemy.active = false;
    enemy.mesh.setEnabled(false);
    this.free.push(enemy);
  }
}