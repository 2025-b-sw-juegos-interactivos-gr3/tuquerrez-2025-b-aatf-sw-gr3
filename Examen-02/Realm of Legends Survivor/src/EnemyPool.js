import { Enemy } from "./Enemy.js";

/**
 * EnemyPool – Object Pooling (GDD §VII.3, HU-03)
 *
 * Pre-crea N enemigos inactivos (cada uno ya tiene su glb clonado).
 * acquire() → activa uno. release() → lo desactiva y lo devuelve a la piscina.
 */
export class EnemyPool {
  constructor(scene, gameManager, poolSize = 80) {
    this.scene       = scene;
    this.gameManager = gameManager;

    this.pool = [];
    this.free = [];

    for (let i = 0; i < poolSize; i++) {
      const enemy  = new Enemy(scene, gameManager, i);
      enemy.active = false;
      enemy._setEnabled(false);
      enemy._animMachine.stopAll();
      this.pool.push(enemy);
      this.free.push(enemy);
    }
  }

  acquire() {
    if (this.free.length === 0) return null;
    const enemy  = this.free.pop();
    enemy.active = true;
    enemy._setEnabled(true);
    return enemy;
  }

  release(enemy) {
    enemy.active = false;
    enemy._animMachine.stopAll();
    enemy._setEnabled(false);
    this.free.push(enemy);
  }
}