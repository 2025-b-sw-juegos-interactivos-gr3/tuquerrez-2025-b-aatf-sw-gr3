import { Vector3 } from "@babylonjs/core";

import { ModelCache } from "./ModelCache.js";
import { AnimStateMachine } from "./AnimStateMachine.js";
import { XpGem } from "./XpGem.js";
import { DamageNumber } from "./DamageNumber.js";

/**
 * Enemy – modelo .glb poolable con animaciones biped.
 *
 * Animaciones:
 *   Persiguiendo al jugador → RUN  (loop, siempre mientras esté vivo)
 *   Muerto                  → DEAD (play once)
 *
 * Rotación: el modelo mira hacia el jugador (dirección de movimiento).
 *   +PI porque glTF humanoids miran -Z por defecto.
 *
 * Pool-compatible:
 *   - Al morir (release): stopAll(), setEnabled(false)
 *   - Al activar (acquire + reset): resetToIdle() → inmediatamente setState("RUN")
 */
export class Enemy {
  constructor(scene, gameManager, index) {
    this.scene       = scene;
    this.gameManager = gameManager;
    this.active      = false;
    this.player      = null;

    // Stats (se configuran en reset() según wave config)
    this.maxHealth = 30;
    this.health    = 30;
    this.speed     = 0.035;
    this.xpReward  = 10;

    // Separación entre enemigos
    this.separationRadius = 1.6;
    this.separationForce  = 0.04;

    // Flash de daño
    this._flashTimer = 0;

    // ─── Clonar modelo desde el cache ───
    // Tercer argumento = escala uniforme del modelo.
    // Ajusta este número para hacer al enemigo más grande o más pequeño.
    const cloned = ModelCache.getInstance().cloneModel("enemy", "enemy_" + index, 2);
    this.mesh         = cloned.root;
    this._childMeshes = cloned.meshes;
    this._animMachine = new AnimStateMachine(cloned.animationGroups);

    // Desactivado inicialmente (pool)
    this._setEnabled(false);

    // ─── Loop (siempre registrado, pero _update verifica this.active) ───
    this._observer = scene.onBeforeRenderObservable.add(() => this._update());
  }

  // ============================================================
  // RESET (reactivar desde el pool)
  // ============================================================
  reset(player, config = {}) {
    this.player    = player;
    this.maxHealth = config.health   || 30;
    this.health    = this.maxHealth;
    this.speed     = config.speed    || 0.035;
    this.xpReward  = config.xpReward || 10;

    // Spawn fuera del campo de visión
    const radius    = config.spawnRadius || 14;
    const angle     = Math.random() * Math.PI * 2;
    const playerPos = this.player.mesh.position;
    this.mesh.position.set(
      playerPos.x + Math.cos(angle) * radius,
      0,
      playerPos.z + Math.sin(angle) * radius
    );

    this._flashTimer = 0;
    this._setEmissive(0, 0, 0);

    // Reactivar animaciones: enseguida pasar a RUN (siempre persigue)
    this._animMachine.resetToIdle();
    this._animMachine.setState("RUN");
  }

  // ============================================================
  // UPDATE
  // ============================================================
  _update() {
    if (!this.active || !this.player) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    // ─── Vector hacia el jugador ───
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

    // ─── Rotar modelo hacia la dirección de movimiento ───
    // Solo rotar si el movimiento es significativo (evita jitter cuando está encima del jugador)
    if (movement.length() > 0.001) {
      this.mesh.rotation.y = Math.atan2(movement.x, movement.z);
    }

    // ─── Flash de daño ───
    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer <= 0) {
        this._setEmissive(0, 0, 0);
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

    // Flash blanco
    this._setEmissive(1, 1, 1);
    this._flashTimer = 0.1;

    // Número flotante de daño
    new DamageNumber(this.scene, this.mesh.position.clone(), Math.floor(amount));

    if (this.health <= 0) this.die();
  }

  die() {
    // Gema de XP
    new XpGem(this.scene, this.mesh.position.clone(), this.xpReward, this.gameManager);

    // Animación de muerte (play once) — no se pone en pool hasta que termina
    this._animMachine.setState("DEAD");

    // Devolver al pool inmediatamente desde GameManager
    // (la animación DEAD seguirá jugando brevemente pero el enemigo ya no interactúa)
    this.gameManager.removeEnemy(this);
  }

  // ============================================================
  // HELPERS: habilitar/deshabilitar y emissive en todos los meshes
  // ============================================================
  _setEnabled(val) {
    for (const m of this._childMeshes) {
      m.setEnabled(val);
    }
  }

  _setEmissive(r, g, b) {
    for (const m of this._childMeshes) {
      if (m.material && m.material.emissiveColor) {
        m.material.emissiveColor.set(r, g, b);
      }
    }
  }
}