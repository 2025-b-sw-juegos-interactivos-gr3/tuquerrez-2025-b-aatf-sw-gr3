import { Vector3, Color3 } from "@babylonjs/core";

import { ModelCache } from "./ModelCache.js";
import { AnimStateMachine } from "./AnimStateMachine.js";
import { InputManager } from "./InputManager.js";
import { AutoAttackSystem } from "./AutoAttackSystem.js";
import { UpgradeMenu } from "./UpgradeMenu.js";

/**
 * Player – modelo .glb con animaciones biped realistas.
 *
 * Animaciones:
 *   Quieto  → IDLE (loop)
 *   Moviendo → RUN  (loop)
 *   Muerto  → DEAD  (play once)
 *
 * Rotación: el modelo mira en la dirección del vector de velocidad.
 *   glTF humanoids tipicamente exportan mirando -Z, así que sumamos PI.
 */
export class Player {
  constructor(scene, gameManager) {
    this.scene = scene;
    this.gameManager = gameManager;

    // 1. En el constructor, añade estas variables de física simple
    this.velocity = Vector3.Zero();
    this.friction = 0.85; // Cuanto más bajo, más rápido frena
    this.acceleration = 0.15;
    this.maxSpeed = 0.2;
    this.targetRotation = 0;

    // ─── Stats ───
    this.speed = 0.12;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isAlive = true;
    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = 50;

    // ─── Clonar modelo desde el cache ───
    // Tercer argumento = escala uniforme del modelo.
    // Ajusta este número para hacer al jugador más grande o más pequeño.
    const cloned = ModelCache.getInstance().cloneModel("player", "player", 2);
    this.mesh = cloned.root;          // pivot: movemos este nodo
    this._childMeshes = cloned.meshes;        // todos los meshes (para flash)
    this._animMachine = new AnimStateMachine(cloned.animationGroups);

    // Posición inicial
    this.mesh.position.set(0, 0, 0);

    // ─── Sub-sistemas ───
    this.input = new InputManager(scene);
    this.autoAttack = new AutoAttackSystem(scene, this, gameManager);
    this.upgradeMenu = new UpgradeMenu(gameManager);

    // ─── Flash ───
    this._damageFlashTimer = 0;

    // ─── Loop ───
    this._observer = scene.onBeforeRenderObservable.add(() => this.update());
  }

  // ============================================================
  // UPDATE
  // ============================================================
  // Reemplaza tu método _update y moveFromInput por este único update
  update() {
    if (!this.isAlive || this.gameManager.state !== "PLAYING") return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    const keys = this.input.keys; // Usamos tu InputManager

    let inputX = 0;
    let inputZ = 0;

    // 1. Capturar Input (Normalizado)
    if (keys["w"] || keys["arrowup"]) inputZ += 1;
    if (keys["s"] || keys["arrowdown"]) inputZ -= 1;
    if (keys["a"] || keys["arrowleft"]) inputX -= 1;
    if (keys["d"] || keys["arrowright"]) inputX += 1;

    if (inputX !== 0 || inputZ !== 0) {
      // Normalizar para que el movimiento diagonal no sea más rápido
      const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
      inputX /= len;
      inputZ /= len;

      // 2. Rotar input para alinearse con la cámara isométrica (-45 grados)
      // Esto hace que "W" se sienta como "arriba" en la pantalla
      const cos45 = 0.7071;
      const moveDirX = inputX * cos45 - inputZ * cos45;
      const moveDirZ = inputX * cos45 + inputZ * cos45;

      // 3. Aplicar Aceleración
      this.velocity.x += moveDirX * this.acceleration;
      this.velocity.z += moveDirZ * this.acceleration;

      // Definir rotación objetivo (Eliminamos el +PI si el modelo ya mira al frente)
      // Si te da la espalda, añade + Math.PI al final
      this.targetRotation = Math.atan2(moveDirX, moveDirZ);

      this._animMachine.setState("RUN");
    } else {
      this._animMachine.setState("IDLE");
    }

    // 4. Aplicar Fricción y limitar Velocidad Máxima
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (currentSpeed > this.maxSpeed) {
      const ratio = this.maxSpeed / currentSpeed;
      this.velocity.x *= ratio;
      this.velocity.z *= ratio;
    }
    this.velocity.scaleInPlace(this.friction);

    // 5. Aplicar Movimiento
    this.mesh.position.addInPlace(this.velocity);

    // 6. Rotación Suave (Lerp)
    let diff = this.targetRotation - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * 0.15; // Ajusta 0.15 para más o menos inercia de giro

    // 7. Timer de Flash de daño
    if (this._damageFlashTimer > 0) {
      this._damageFlashTimer -= dt;
      if (this._damageFlashTimer <= 0) this._setEmissive(0, 0, 0);
    }

    // --- LÓGICA DE DISPARO (AÑADE ESTO AQUÍ) ---
    if (this.autoAttack) {
        this.autoAttack.update(dt); 
    }

    // --- FLASH DE DAÑO ---
    if (this._damageFlashTimer > 0) {
        this._damageFlashTimer -= dt;
        if (this._damageFlashTimer <= 0) this._setEmissive(0, 0, 0);
    }
  }

  // ============================================================
  // VIDA & DAÑO
  // ============================================================
  takeDamage(amount) {
    if (!this.isAlive) return;
    this.health -= amount;

    // Flash rojo en todos los meshes hijos
    this._setEmissive(0.8, 0.1, 0.1);
    this._damageFlashTimer = 0.12;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this._setEmissive(1, 0, 0);
    this._animMachine.setState("DEAD");
    this.autoAttack.stop();
    this.gameManager.gameOver();
  }

  // ─── Iterar todos los meshes hijos y setear emissiveColor ───
  _setEmissive(r, g, b) {
    for (const m of this._childMeshes) {
      if (m.material && m.material.emissiveColor) {
        m.material.emissiveColor.set(r, g, b);
      }
    }
  }

  // ============================================================
  // XP & NIVELES
  // ============================================================
  gainXp(amount) {
    if (!this.isAlive || this.gameManager.state !== "PLAYING") return;
    this.currentXp += amount;
    if (this.currentXp >= this.xpToNextLevel) this.levelUp();
  }

  levelUp() {
    this.level++;
    this.currentXp = 0;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
    this.maxHealth += 10;
    this.health = Math.min(this.health + 15, this.maxHealth);

    this.gameManager.pauseGame();
    this.upgradeMenu.show(this);
  }

  // ============================================================
  // RESET
  // ============================================================
  reset() {
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = 50;
    this.speed = 0.12;
    this.mesh.position.set(0, 0, 0);
    this._setEmissive(0, 0, 0);
    this._animMachine.resetToIdle();
    this.autoAttack.reset();
  }
}