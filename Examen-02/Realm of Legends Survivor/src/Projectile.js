import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3
} from "@babylonjs/core";

/**
 * Projectile – proyectil disparado por el AutoAttackSystem.
 *
 * Bug original: el constructor recibía (scene, position) pero usaba `direction`
 * sin que fuera parámetro. Ahora recibe direction, damage y speed explícitamente.
 *
 * Se auto-destruye al impactar un enemigo o al salir del rango.
 */
export class Projectile {
  constructor(scene, position, direction, damage = 10, speed = 14, gameManager) {
    this.scene = scene;
    this.gameManager = gameManager;
    this.damage = damage;
    this.speed = speed;
    this.alive = true;
    this.lifetime = 3; // segundos máximo antes de desaparecer
    this._timer = 0;

    // Dirección normalizada
    this.direction = direction.clone().normalize();

    // ─── Mesh: esfera pequeña ───
    this.mesh = MeshBuilder.CreateSphere("projectile", { diameter: 0.35 }, scene);
    const spawnPosition = position.clone();
    spawnPosition.y += 3.5;

    this.mesh.position = spawnPosition;

    const mat = new StandardMaterial("projMat_" + Math.random().toString(36).slice(2, 8), scene);
    mat.emissiveColor = new Color3(1, 0.7, 0.1); // glow naranja
    mat.disableLighting = true;
    this.mesh.material = mat;

    // ─── Loop ───
    this._observer = scene.onBeforeRenderObservable.add(() => this._update());
  }

  _update() {
    if (!this.alive) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this._timer += dt;

    // Movimiento
    this.mesh.position.addInPlace(this.direction.scale(this.speed * dt));

    // Timeout: el proyectil desaparece si no impacta
    if (this._timer > this.lifetime) {
      this.destroy();
      return;
    }

    // Colisión con enemigos
    this.checkCollision();
  }

  checkCollision() {
    const enemies = this.gameManager.enemies;
    const pos = this.mesh.position;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.mesh) continue;

      // ─── CAMBIO AQUÍ: Distancia plana (X, Z) ───
      // Calculamos la diferencia de posición
      const dx = pos.x - enemy.mesh.position.x;
      const dz = pos.z - enemy.mesh.position.z;

      // Pitágoras en 2D: √(dx² + dz²)
      const dist2D = Math.sqrt(dx * dx + dz * dz);

      if (dist2D < 1.0) { // El radio de 1.0 ahora es un cilindro
        enemy.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }

  destroy() {
    this.alive = false;
    // Desregistrar observer para evitar memory leak
    this.scene.onBeforeRenderObservable.remove(this._observer);
    this.mesh.dispose();
    this.mesh = null;
  }
}