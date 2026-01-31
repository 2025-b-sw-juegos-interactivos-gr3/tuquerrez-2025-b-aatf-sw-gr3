/**
 * HUD – Heads-Up Display (DOM overlay)
 *
 * Muestra en tiempo real:
 *   - Barra de vida del jugador
 *   - Barra de XP y nivel actual
 *   - Tiempo de supervivencia
 *   - Score
 *
 * También gestiona la pantalla de Game Over con score final y botón de reinicio.
 */
export class HUD {
  constructor() {
    this._gameManager = null; // se setea desde GameManager después de construirse
    this._ensureDOM();
  }

  setGameManager(gm) {
    this._gameManager = gm;
  }

  _ensureDOM() {
    if (document.getElementById("gameHUD")) return;

    // ─── HUD principal ───
    const hud = document.createElement("div");
    hud.id = "gameHUD";
    hud.style.cssText = `
      position: fixed; top: 16px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: flex-start;
      z-index: 50; pointer-events: none;
      font-family: 'Segoe UI', sans-serif;
    `;

    // ─── Panel izquierdo: vida + XP ───
    const leftPanel = document.createElement("div");
    leftPanel.style.cssText = `
      background: rgba(0,0,0,0.6);
      border-radius: 12px;
      padding: 14px 18px;
      min-width: 220px;
      border: 1px solid rgba(255,255,255,0.1);
    `;

    // Vida
    const hpLabel = document.createElement("div");
    hpLabel.style.cssText = "color: #e94560; font-size: 13px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;";
    hpLabel.textContent = "❤️  Vida";

    const hpBarBg = document.createElement("div");
    hpBarBg.style.cssText = "background: #222; border-radius: 6px; height: 18px; overflow: hidden; margin-bottom: 10px;";

    const hpBar = document.createElement("div");
    hpBar.id = "hpBar";
    hpBar.style.cssText = "width: 100%; height: 100%; background: linear-gradient(90deg, #e94560, #ff6b6b); border-radius: 6px; transition: width 0.2s;";
    hpBarBg.appendChild(hpBar);

    const hpText = document.createElement("div");
    hpText.id = "hpText";
    hpText.style.cssText = "color: #aaa; font-size: 11px; margin-bottom: 10px;";

    // XP
    const xpLabel = document.createElement("div");
    xpLabel.style.cssText = "color: #4ecdc4; font-size: 13px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;";
    xpLabel.textContent = "✨ Experiencia";

    const xpBarBg = document.createElement("div");
    xpBarBg.style.cssText = "background: #222; border-radius: 6px; height: 14px; overflow: hidden;";

    const xpBar = document.createElement("div");
    xpBar.id = "xpBar";
    xpBar.style.cssText = "width: 0%; height: 100%; background: linear-gradient(90deg, #4ecdc4, #45b7d1); border-radius: 6px; transition: width 0.15s;";
    xpBarBg.appendChild(xpBar);

    const xpText = document.createElement("div");
    xpText.id = "xpText";
    xpText.style.cssText = "color: #aaa; font-size: 11px; margin-top: 4px;";

    leftPanel.appendChild(hpLabel);
    leftPanel.appendChild(hpBarBg);
    leftPanel.appendChild(hpText);
    leftPanel.appendChild(xpLabel);
    leftPanel.appendChild(xpBarBg);
    leftPanel.appendChild(xpText);

    // ─── Panel derecho: tiempo + score + nivel ───
    const rightPanel = document.createElement("div");
    rightPanel.style.cssText = `
      background: rgba(0,0,0,0.6);
      border-radius: 12px;
      padding: 14px 18px;
      text-align: right;
      border: 1px solid rgba(255,255,255,0.1);
      min-width: 160px;
    `;

    const levelText = document.createElement("div");
    levelText.id = "levelText";
    levelText.style.cssText = "color: #f9ca24; font-size: 22px; font-weight: bold;";

    const timeText = document.createElement("div");
    timeText.id = "timeText";
    timeText.style.cssText = "color: #fff; font-size: 14px; margin-top: 4px;";

    const scoreText = document.createElement("div");
    scoreText.id = "scoreText";
    scoreText.style.cssText = "color: #aaa; font-size: 12px; margin-top: 2px;";

    const killsText = document.createElement("div");
    killsText.id = "killsText";
    killsText.style.cssText = "color: #aaa; font-size: 11px; margin-top: 2px;";

    rightPanel.appendChild(levelText);
    rightPanel.appendChild(timeText);
    rightPanel.appendChild(scoreText);
    rightPanel.appendChild(killsText);

    hud.appendChild(leftPanel);
    hud.appendChild(rightPanel);
    document.body.appendChild(hud);

    // ─── Game Over Overlay ───
    const goOverlay = document.createElement("div");
    goOverlay.id = "gameOverOverlay";
    goOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: none;
      flex-direction: column;
      justify-content: center; align-items: center;
      z-index: 200;
      font-family: 'Segoe UI', sans-serif;
    `;

    const goTitle = document.createElement("h1");
    goTitle.style.cssText = "color: #e94560; font-size: 64px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 6px; text-shadow: 0 0 30px rgba(233,69,96,0.5);";
    goTitle.textContent = "Game Over";

    const goStats = document.createElement("div");
    goStats.id = "goStats";
    goStats.style.cssText = "color: #ccc; font-size: 18px; line-height: 2; text-align: center; margin-bottom: 32px;";

    const goButton = document.createElement("button");
    goButton.id = "goRestartBtn";
    goButton.textContent = "🔄  Jugar de nuevo";
    goButton.style.cssText = `
      background: linear-gradient(135deg, #e94560, #c23152);
      color: white; border: none; padding: 14px 36px;
      font-size: 18px; font-weight: bold; border-radius: 30px;
      cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
      pointer-events: auto;
    `;
    goButton.onmouseover = () => {
      goButton.style.transform  = "scale(1.05)";
      goButton.style.boxShadow  = "0 4px 20px rgba(233,69,96,0.5)";
    };
    goButton.onmouseout = () => {
      goButton.style.transform  = "scale(1)";
      goButton.style.boxShadow  = "none";
    };
    goButton.onclick = () => {
      if (this._gameManager) {
        this._gameManager.restartGame();
      }
    };

    goOverlay.appendChild(goTitle);
    goOverlay.appendChild(goStats);
    goOverlay.appendChild(goButton);
    document.body.appendChild(goOverlay);
  }

  /**
   * Actualiza todos los elementos del HUD cada frame.
   */
  update(gm) {
    const player = gm.player;

    // Vida
    const hpPercent = Math.max(0, (player.health / player.maxHealth) * 100);
    document.getElementById("hpBar").style.width  = hpPercent + "%";
    document.getElementById("hpText").textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    // XP
    const xpPercent = player.xpToNextLevel > 0
      ? (player.currentXp / player.xpToNextLevel) * 100
      : 0;
    document.getElementById("xpBar").style.width  = xpPercent + "%";
    document.getElementById("xpText").textContent = `${player.currentXp} / ${player.xpToNextLevel} XP`;

    // Nivel
    document.getElementById("levelText").textContent = `Nivel ${player.level}`;

    // Tiempo
    const mins = Math.floor(gm.elapsedTime / 60);
    const secs = Math.floor(gm.elapsedTime % 60).toString().padStart(2, "0");
    document.getElementById("timeText").textContent = `⏱️  ${mins}:${secs}`;

    // Score & Kills
    document.getElementById("scoreText").textContent = `Score: ${gm.score}`;
    document.getElementById("killsText").textContent = `Kills: ${gm.enemiesKilled}`;
  }

  // ─── Game Over ───
  showGameOver(score, time, kills, level) {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, "0");

    document.getElementById("goStats").innerHTML = `
      <strong style="color:#f9ca24; font-size:28px;">Score: ${score}</strong><br>
      ⏱️  Tiempo sobrevivido: ${mins}:${secs}<br>
      ⚔️  Enemigos eliminados: ${kills}<br>
      📈 Nivel alcanzado: ${level}
    `;

    document.getElementById("gameOverOverlay").style.display = "flex";
  }

  hideGameOver() {
    document.getElementById("gameOverOverlay").style.display = "none";
  }
}