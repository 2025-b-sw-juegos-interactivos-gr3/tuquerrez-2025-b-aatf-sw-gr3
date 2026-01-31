import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Texture,
  Color3
} from "@babylonjs/core";

import { InputManager } from "./InputManager.js";
import { AutoAttackSystem } from "./AutoAttackSystem.js";
import { UpgradeMenu } from "./UpgradeMenu.js";

/**
 * Player – Hereda conceptualmente de Entity (GDD §VII.2)
 * Gestiona: movimiento WASD, vida, XP, niveles, mejoras.
 */
export class Player {
  constructor(scene, gameManager) {
    this.scene       = scene;
    this.gameManager = gameManager;

    // ─── Stats base ───
    this.speed     = 0.12;
    this.maxHealth = 100;
    this.health    = this.maxHealth;
    this.isAlive   = true;

    // ─── XP & Nivel (GDD §III.1 core loop) ───
    this.level       = 1;
    this.currentXp   = 0;
    this.xpToNextLevel = 50; // crece con cada nivel

    // ─── Mesh ───
    this.mesh = MeshBuilder.CreatePlane("player", { size: 2 }, scene);
    this.mesh.position.set(0, 1, 0);
    this.mesh.billboardMode = 7; // siempre mira a la cámara

    const mat = new StandardMaterial("playerMat", scene);
    mat.diffuseTexture = new Texture("/assets/textures/npc.jpeg", scene);
    mat.emissiveColor  = new Color3(0, 0, 0);
    this.mesh.material = mat;

    // ─── Sub-sistemas ───
    this.input      = new InputManager(scene);
    this.autoAttack = new AutoAttackSystem(scene, this, gameManager);

    // ─── Menú de mejoras (se muestra al subir de nivel) ───
    this.upgradeMenu = new UpgradeMenu(gameManager);

    // ─── Flash de daño recibido ───
    this._damageFlashTimer = 0;

    // ─── Loop ───
    this._observer = scene.onBeforeRenderObservable.add(() => this.update());
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update() {
    if (!this.isAlive || this.gameManager.state !== "PLAYING") return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    // ─── Movimiento WASD (GDD HU-01: 8 direcciones) ───
    this.moveFromInput(dt);

    // ─── Auto-attack (se maneja internamente en AutoAttackSystem) ───
    this.autoAttack.update(dt);

    // ─── Flash de daño: apaga el color emissive tras timeout ───
    if (this._damageFlashTimer > 0) {
      this._damageFlashTimer -= dt;
      if (this._damageFlashTimer <= 0) {
        this.mesh.material.emissiveColor.set(0, 0, 0);
      }
    }
  }

  moveFromInput(dt) {
    const keys = this.input.keys;
    let dx = 0, dz = 0;

    if (keys["w"] || keys["arrowup"])    dz += 1;
    if (keys["s"] || keys["arrowdown"])  dz -= 1;
    if (keys["a"] || keys["arrowleft"])  dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;

    if (dx !== 0 || dz !== 0) {
      // Normalizar para que las diagonales no sean más rápidas
      const len = Math.sqrt(dx * dx + dz * dz);
      dx /= len;
      dz /= len;

      // Ajustar al sistema de ejes de la cámara isométrica
      // La cámara rota -45° en alpha, así que rotamos el input
      const cos45 = 0.7071;
      const worldDx = (dx * cos45 - dz * cos45);
      const worldDz = (dx * cos45 + dz * cos45);

      this.mesh.position.x += worldDx * this.speed;
      this.mesh.position.z += worldDz * this.speed;
    }
  }

  // ============================================================
  // VIDA & DAÑO
  // ============================================================
  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;

    // Flash rojo al recibir daño
    this.mesh.material.emissiveColor.set(0.8, 0.1, 0.1);
    this._damageFlashTimer = 0.12;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.mesh.material.emissiveColor.set(1, 0, 0);
    this.autoAttack.stop();
    this.gameManager.gameOver();
  }

  // ============================================================
  // XP & NIVELES (GDD §III.1 – core loop)
  // ============================================================
  gainXp(amount) {
    if (!this.isAlive || this.gameManager.state !== "PLAYING") return;

    this.currentXp += amount;

    if (this.currentXp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.currentXp = 0;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4); // escala exponencial
    this.maxHealth += 10; // pequeña mejora pasiva de vida
    this.health = Math.min(this.health + 15, this.maxHealth); // pequeña curación

    // Pausar juego y mostrar menú de mejoras (GDD §III.1 "Pausa → Menú Level Up")
    this.gameManager.pauseGame();
    this.upgradeMenu.show(this);
  }

  // ============================================================
  // RESET (para reiniciar partida)
  // ============================================================
  reset() {
    this.health         = 100;
    this.maxHealth      = 100;
    this.isAlive        = true;
    this.level          = 1;
    this.currentXp      = 0;
    this.xpToNextLevel  = 50;
    this.speed          = 0.12;
    this.mesh.position.set(0, 1, 0);
    this.mesh.material.emissiveColor.set(0, 0, 0);
    this.autoAttack.reset();
  }
}