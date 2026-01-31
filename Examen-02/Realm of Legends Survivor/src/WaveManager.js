/**
 * WaveManager – Sistema de Hordas (GDD §III.2)
 *
 * Controla CUÁNDO y QUÉ enemigos aparecen según el GameTime.
 *   Minuto 0-2:  Esqueletos débiles, pequeños grupos
 *   Minuto 2-5:  Más enemigos, ligeramente más fuertes
 *   Minuto 5:    Boss intermedio (mucha vida)
 *   Minuto 5-10: Enemigos mágicos, más rápidos
 *   Minuto 10+:  "La Horda" – spawn masivo, elite
 *
 * El spawn se hace por ticks (cada spawnInterval segundos).
 * La cantidad y stats de enemigos escalan con el tiempo.
 */
export class WaveManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.reset();
  }

  reset() {
    this.spawnTimer = 0;
    this.bossSpawned5  = false;
    this.bossSpawned10 = false;
  }

  update(dt) {
    const elapsed = this.gm.elapsedTime; // segundos

    // Calcular intervalo y cantidad según tiempo
    const { interval, count, config } = this.getSpawnConfig(elapsed);

    this.spawnTimer += dt;
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;

      // Spawn un grupo de enemigos
      for (let i = 0; i < count; i++) {
        this.gm.spawnEnemy(config);
      }
    }

    // ─── Boss a los 5 minutos (GDD: "Boss intermedio – Muralla de HP") ───
    if (elapsed >= 300 && !this.bossSpawned5) {
      this.bossSpawned5 = true;
      this.gm.spawnEnemy({
        health:      200,
        speed:       0.025,
        xpReward:    80,
        spawnRadius: 10
      });
    }

    // ─── Boss a los 10 minutos (La Horda elite) ───
    if (elapsed >= 600 && !this.bossSpawned10) {
      this.bossSpawned10 = true;
      this.gm.spawnEnemy({
        health:      500,
        speed:       0.03,
        xpReward:    150,
        spawnRadius: 10
      });
    }
  }

  /**
   * Retorna { interval (s), count, config } según el tiempo transcurrido.
   */
  getSpawnConfig(elapsed) {
    // ─── Minuto 10+ : La Horda ───
    if (elapsed >= 600) {
      return {
        interval: 0.4,
        count:    3,
        config: {
          health:      60,
          speed:       0.045,
          xpReward:    25,
          spawnRadius: 16
        }
      };
    }

    // ─── Minuto 5-10 : Ruinas del Crepúsculo ───
    if (elapsed >= 300) {
      return {
        interval: 1.0,
        count:    2,
        config: {
          health:      55,
          speed:       0.04,
          xpReward:    18,
          spawnRadius: 15
        }
      };
    }

    // ─── Minuto 2-5 : Intensificación ───
    if (elapsed >= 120) {
      return {
        interval: 1.8,
        count:    2,
        config: {
          health:      40,
          speed:       0.037,
          xpReward:    14,
          spawnRadius: 14
        }
      };
    }

    // ─── Minuto 0-2 : Inicio (Praderas de Aethelgard) ───
    return {
      interval: 2.5,
      count:    1,
      config: {
        health:      30,
        speed:       0.035,
        xpReward:    10,
        spawnRadius: 14
      }
    };
  }
}