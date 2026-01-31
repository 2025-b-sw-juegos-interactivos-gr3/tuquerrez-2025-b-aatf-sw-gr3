import { Vector3 } from "@babylonjs/core";
import { ModelCache } from "./ModelCache.js";
import { Player } from "./Player.js";
import { EnemyPool } from "./EnemyPool.js";
import { WaveManager } from "./WaveManager.js";

/**
 * GameManager – Singleton (GDD §VII.2)
 * Estados: PLAYING | PAUSED | GAMEOVER
 *
 * getInstance() es async porque necesita await ModelCache.init()
 * antes de construir Player y EnemyPool (ambos clonan desde el cache).
 */
export class GameManager {
  static instance = null;

  static async getInstance(scene, camera, hud) {
    if (!GameManager.instance) {
      // ─── Cargar modelos .glb ANTES de crear cualquier personaje ───
      await ModelCache.getInstance().init(scene);

      GameManager.instance = new GameManager(scene, camera, hud);
    }
    return GameManager.instance;
  }

  constructor(scene, camera, hud) {
    this.scene  = scene;
    this.camera = camera;
    this.hud    = hud;
    this.hud.setGameManager(this);

    // ─── Estado del juego ───
    this.state = "PLAYING"; // PLAYING | PAUSED | GAMEOVER

    // ─── Tiempo y Score (GDD §II.3 – Score formula) ───
    this.elapsedTime   = 0; // segundos totales
    this.enemiesKilled = 0;
    this.score         = 0;

    // ─── Pool de enemigos (Object Pooling, GDD §VII.3) ───
    this.enemyPool = new EnemyPool(scene, this, 80);
    this.enemies   = []; // enemies activos en el mundo

    // ─── Jugador ───
    this.player = new Player(scene, this);

    // ─── Wave Manager (GDD §III.2 – Sistema de Hordas) ───
    this.waveManager = new WaveManager(this);

    // ─── Daño por contacto ───
    this.damageRadius    = 1.3;
    this.damagePerSecond = 8; // por enemigo en contacto

    // ─── Loop principal ───
    this._observer = scene.onBeforeRenderObservable.add(() => this.update());
  }

  // ============================================================
  // UPDATE PRINCIPAL
  // ============================================================
  update() {
    if (this.state !== "PLAYING") return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this.elapsedTime += dt;

    // Seguimiento de cámara al jugador
    this.camera.target = Vector3.Lerp(
      this.camera.target,
      this.player.mesh.position,
      0.08
    );

    // Spawning de enemigos según olas
    this.waveManager.update(dt);

    // Daño al jugador por contacto con enemigos
    this.applyContactDamage(dt);

    // Actualizar score en tiempo real
    this.updateScore();

    // Actualizar HUD
    this.hud.update(this);
  }

  // ─── Score (GDD: Score = Tiempo*10 + Kills*1 + Nivel*50) ───
  updateScore() {
    this.score =
      Math.floor(this.elapsedTime) * 10 +
      this.enemiesKilled * 1 +
      this.player.level * 50;
  }

  // ─── Daño por contacto (GDD §III.1 – enemigos tocan al jugador) ───
  applyContactDamage(dt) {
    if (!this.player.isAlive) return;

    let touching = 0;
    const playerPos = this.player.mesh.position;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dist = Vector3.Distance(enemy.mesh.position, playerPos);
      if (dist < this.damageRadius) touching++;
    }

    if (touching > 0) {
      this.player.takeDamage(touching * this.damagePerSecond * dt);
    }
  }

  // ============================================================
  // SPAWN / POOL
  // ============================================================
  spawnEnemy(config = {}) {
    const enemy = this.enemyPool.acquire();
    if (!enemy) return null; // pool agotado

    enemy.reset(this.player, config);
    this.enemies.push(enemy);
    return enemy;
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
    this.enemyPool.release(enemy);
    this.enemiesKilled++;
  }

  // ============================================================
  // PAUSA (para menú Level Up, GDD §III.1 step "Trigger")
  // ============================================================
  pauseGame() {
    this.state = "PAUSED";
  }

  resumeGame() {
    this.state = "PLAYING";
  }

  // ============================================================
  // GAME OVER
  // ============================================================
  gameOver() {
    this.state = "GAMEOVER";
    this.updateScore();
    this.hud.showGameOver(this.score, this.elapsedTime, this.enemiesKilled, this.player.level);
  }

  // Reinicio completa de la partida
  restartGame() {
    // Limpiar enemigos activos
    for (const enemy of [...this.enemies]) {
      this.removeEnemy(enemy);
    }

    // Reset player
    this.player.reset();

    // Reset stats
    this.elapsedTime   = 0;
    this.enemiesKilled = 0;
    this.score         = 0;

    // Reset wave manager
    this.waveManager.reset();

    // Ocultar game over screen
    this.hud.hideGameOver();

    this.state = "PLAYING";
  }
}