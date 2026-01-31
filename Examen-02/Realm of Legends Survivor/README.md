# Realm of Legends: Survivor

Un roguelite de supervivencia en el que debes sobrevivir oleadas infinitas de enemigos, subir de nivel, y elegir mejoras estratégicas para aguantar lo más tiempo posible.

**Motor:** Babylon.js v6  
**Lenguaje:** JavaScript (ES Modules)  
**No requiere:** compilador, bundler ni instalaciones de software adicionales.

---

## Cómo ejecutar

### Opción A — Con un servidor estático simple (recomendada)

1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/realm-of-legends-survivor.git
   cd realm-of-legends-survivor
   ```

2. Instala Node.js si no lo tienes (cualquier versión 16+).

3. Instala un servidor estático global (una sola vez):
   ```bash
   npm install -g serve
   ```

4. Inicia el servidor desde la carpeta del proyecto:
   ```bash
   serve .
   ```

5. Abre el navegador en:
   ```
   http://localhost:5000
   ```

### Opción B — Con VS Code (sin instalar nada extra)

1. Abre la carpeta del proyecto en VS Code.
2. Instala la extensión **Live Server** (Ritwick Choudhury).
3. Haz clic en **"Go Live"** en la barra inferior.
4. El juego abre automáticamente en el navegador.

### Opción C — Con Python (si ya lo tienes instalado)

```bash
cd realm-of-legends-survivor
python -m http.server 8000
```
Abre `http://localhost:8000` en el navegador.

---

## Estructura del proyecto

```
realm-of-legends-survivor/
├── index.html              # Entrada principal
├── src/
│   ├── main.js             # Inicialización: motor, cámara, luz, GameManager
│   ├── GameManager.js      # Singleton central: estado, score, loop principal
│   ├── Player.js           # Jugador: movimiento, vida, XP, niveles
│   ├── Enemy.js            # Enemigo individual: IA, daño, muerte
│   ├── EnemyPool.js        # Object Pooling de 80 enemigos
│   ├── ModelCache.js       # Carga asíncrona y clonado síncrono de modelos .glb
│   ├── AnimStateMachine.js # Máquina de estados: IDLE → RUN → DEAD
│   ├── AutoAttackSystem.js # Disparo automático al enemigo más cercano
│   ├── WaveManager.js      # Sistema de hordas escalado por tiempo
│   ├── UpgradeMenu.js      # Menú de mejoras al subir de nivel
│   ├── Projectile.js       # Proyectil: movimiento y colisión
│   ├── XpGem.js            # Gema de XP: recolección automática
│   ├── DamageNumber.js     # Números flotantes de daño
│   ├── InputManager.js     # Captura de teclado
│   ├── GroundSystem.js     # Suelo infinito con tiling
│   └── HUD.js              # Interfaz: vida, XP, tiempo, score, Game Over
└── assets/
    ├── models/
    │   ├── player.glb      # Modelo 3D del jugador (humanoid con animaciones)
    │   └── enemy.glb       # Modelo 3D del enemigo (humanoid con animaciones)
    └── textures/
        └── ground.png      # Textura del suelo (se repite con tiling)
```

## Controles

| Tecla | Acción |
|---|---|
| W / ↑ | Mover arriba |
| S / ↓ | Mover abajo |
| A / ← | Mover izquierda |
| D / → | Mover derecha |
| Mouse | Seleccionar mejoras en el menú |

El ataque es automático. No hay botón de disparar.

---

## Modelos .glb

El juego espera dos archivos de modelo humanoid en `assets/models/`:

- `player.glb`
- `enemy.glb`

Ambos deben tener un esqueleto rigged y al menos estas animaciones (los nombres pueden variar, el sistema las busca automáticamente):

| Animación | Palabras clave que el sistema reconoce |
|---|---|
| Quieto (loop) | `idle`, `stand`, `breath` |
| Correr (loop) | `run`, `walk`, `move` |
| Muerte (una vez) | `death`, `die`, `dead`, `fall` |

Los exports de **Mixamo** funcionan directamente sin modificaciones.