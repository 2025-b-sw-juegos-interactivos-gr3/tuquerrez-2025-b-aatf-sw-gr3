/**
 * UpgradeMenu – Menú de mejoras al subir de nivel (GDD HU-05, §III.1)
 *
 * GDD Core Loop paso "Decisión":
 *   "Jugador elige 1 de 3 mejoras (Ej: Hacha Giratoria o Aumento de Daño)"
 *
 * Criterios de aceptación:
 *   ✓ Al subir de nivel, aparece menú con 3 opciones distintas
 *   ✓ Las opciones se seleccionan al azar
 *   ✓ Al elegir, la mejora se aplica inmediatamente y el juego reanuda
 *
 * Implementación: DOM overlay (más simple y flexible que un plane 3D para UI).
 */

// Pool de mejoras disponibles (base de datos de items)
const UPGRADES = [
  { id: "damage_up",     label: "⚔️  Daño +30%",         desc: "Los proyectiles infligen más daño",        apply: (p) => p.autoAttack.applyUpgrade("damage_up") },
  { id: "cooldown_up",   label: "⚡ Velocidad +25%",     desc: "El cooldown de ataque se reduce",          apply: (p) => p.autoAttack.applyUpgrade("cooldown_up") },
  { id: "range_up",      label: "🎯 Rango +3",           desc: "El radio de búsqueda de enemigos aumenta", apply: (p) => p.autoAttack.applyUpgrade("range_up") },
  { id: "health_up",     label: "❤️  Vida +25",          desc: "Tu vida máxima aumenta en 25",             apply: (p) => { p.maxHealth += 25; p.health = Math.min(p.health + 25, p.maxHealth); } },
  { id: "speed_up",      label: "💨 Velocidad mov +15%", desc: "Te mueves más rápido",                     apply: (p) => { p.speed *= 1.15; } },
  { id: "heal_up",       label: "🌿 Curación",           desc: "Recupera 30 puntos de vida ahora",         apply: (p) => { p.health = Math.min(p.health + 30, p.maxHealth); } },
];

export class UpgradeMenu {
  constructor(gameManager) {
    this.gm = gameManager;
    this._container = null;
    this._ensureDOM();
  }

  _ensureDOM() {
    // Crear el overlay DOM una sola vez
    if (document.getElementById("upgradeOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "upgradeOverlay";
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center; align-items: center;
      z-index: 100;
      font-family: 'Segoe UI', sans-serif;
    `;

    const panel = document.createElement("div");
    panel.id = "upgradePanel";
    panel.style.cssText = `
      background: linear-gradient(145deg, #1a1a2e, #16213e);
      border: 2px solid #e94560;
      border-radius: 16px;
      padding: 32px;
      max-width: 520px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 40px rgba(233,69,96,0.3);
    `;

    const title = document.createElement("h2");
    title.id = "upgradeTitle";
    title.style.cssText = "color: #e94560; margin: 0 0 8px; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;";
    title.textContent = "¡Subiste de nivel!";

    const subtitle = document.createElement("p");
    subtitle.id = "upgradeSubtitle";
    subtitle.style.cssText = "color: #aaa; margin: 0 0 24px; font-size: 15px;";

    const cardsContainer = document.createElement("div");
    cardsContainer.id = "upgradeCards";
    cardsContainer.style.cssText = "display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;";

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(cardsContainer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    this._overlay = overlay;
  }

  /**
   * Muestra el menú con 3 mejoras aleatorias (sin repetir).
   */
  show(player) {
    this._ensureDOM();
    const overlay = document.getElementById("upgradeOverlay");
    const subtitle = document.getElementById("upgradeSubtitle");
    const cardsContainer = document.getElementById("upgradeCards");

    subtitle.textContent = `Nivel ${player.level} alcanzado. ¡Elige una mejora!`;
    cardsContainer.innerHTML = ""; // limpiar cards previas

    // Seleccionar 3 mejoras aleatorias sin repetir
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    const choices  = shuffled.slice(0, 3);

    choices.forEach((upgrade) => {
      const card = document.createElement("div");
      card.style.cssText = `
        flex: 1; min-width: 130px; max-width: 160px;
        background: #0f3460;
        border: 1px solid #e94560;
        border-radius: 12px;
        padding: 18px 12px;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
      `;
      card.onmouseover = () => {
        card.style.transform  = "translateY(-4px)";
        card.style.boxShadow  = "0 4px 20px rgba(233,69,96,0.4)";
      };
      card.onmouseout = () => {
        card.style.transform  = "translateY(0)";
        card.style.boxShadow  = "none";
      };
      card.onclick = () => this._select(player, upgrade);

      const label = document.createElement("div");
      label.style.cssText = "color: #fff; font-weight: bold; font-size: 15px; margin-bottom: 8px;";
      label.textContent = upgrade.label;

      const desc = document.createElement("div");
      desc.style.cssText = "color: #aaa; font-size: 12px; line-height: 1.3;";
      desc.textContent = upgrade.desc;

      card.appendChild(label);
      card.appendChild(desc);
      cardsContainer.appendChild(card);
    });

    overlay.style.display = "flex";
  }

  _select(player, upgrade) {
    // Aplicar la mejora inmediatamente
    upgrade.apply(player);

    // Ocultar overlay
    document.getElementById("upgradeOverlay").style.display = "none";

    // Reanudar juego
    this.gm.resumeGame();
  }

  hide() {
    const overlay = document.getElementById("upgradeOverlay");
    if (overlay) overlay.style.display = "none";
  }
}