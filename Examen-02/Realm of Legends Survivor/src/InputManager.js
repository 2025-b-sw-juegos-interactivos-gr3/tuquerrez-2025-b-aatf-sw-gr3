/**
 * InputManager – captura estado de teclado en tiempo real.
 * El Player lo consulta cada frame para movimiento en 8 direcciones (GDD HU-01).
 */
export class InputManager {
  constructor(scene) {
    this.scene = scene;
    // Map de teclas actualmente presionadas
    this.keys = {};

    // Registrar eventos de teclado
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }
}