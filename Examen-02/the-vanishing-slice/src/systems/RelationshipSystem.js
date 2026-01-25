/**
 * RELATIONSHIP SYSTEM
 * Patrón de Diseño: Observer Pattern (mediante callbacks)
 * 
 * Gestiona las relaciones del jugador con los NPCs
 * Basado en la sección 5.1.3 del GDD: "Relationship System"
 * 
 * Estados:
 * - HOSTILE: < -10 (Color Rojo)
 * - NEUTRAL: -10 a 20 (Color Gris)
 * - FRIENDLY: > 20 (Color Verde)
 */

export class RelationshipSystem {
    constructor(scene) {
        this.scene = scene;
        this.points = 0; // Puntos de relación actual (-100 a +100)
        this.state = 'NEUTRAL';
        
        // Referencias al DOM
        this.fillBar = document.getElementById('relationship-fill');
        this.statusText = document.getElementById('relationship-status');

        // Array de NPCs que cambiarán de color
        this.npcMeshes = [];
        
        // Colores base para cada estado
        this.colors = {
            HOSTILE: { r: 0.8, g: 0.2, b: 0.2 },   // Rojo
            NEUTRAL: { r: 0.5, g: 0.5, b: 0.8 },   // Azul grisáceo
            FRIENDLY: { r: 0.2, g: 0.8, b: 0.2 }   // Verde
        };

        this.updateUI();
    }

    /**
     * Registra un NPC para que sea afectado por el sistema
     * @param {BABYLON.Mesh} mesh - Mesh del NPC
     */
    registerNPC(mesh) {
        if (!mesh.metadata) {
            mesh.metadata = {};
        }
        mesh.metadata.originalColor = mesh.material.diffuseColor.clone();
        this.npcMeshes.push(mesh);
    }

    /**
     * Añade o resta puntos de relación
     * @param {number} amount - Cantidad a añadir (positivo) o restar (negativo)
     */
    addPoints(amount) {
        const previousPoints = this.points;
        this.points = Math.max(-100, Math.min(100, this.points + amount));

        console.log(`[RelationshipSystem] Cambio: ${amount > 0 ? '+' : ''}${amount} | Total: ${this.points}`);

        // Detectar cambio de estado
        const previousState = this.state;
        this.updateState();

        if (previousState !== this.state) {
            console.log(`[RelationshipSystem] Estado cambió: ${previousState} → ${this.state}`);
            this.onStateChange();
        }

        this.updateUI();
        this.updateNPCColors();
    }

    /**
     * Actualiza el estado basado en los puntos actuales
     */
    updateState() {
        if (this.points > 20) {
            this.state = 'FRIENDLY';
        } else if (this.points < -10) {
            this.state = 'HOSTILE';
        } else {
            this.state = 'NEUTRAL';
        }
    }

    /**
     * Callback cuando cambia el estado de relación
     */
    onStateChange() {
        // Aquí podrías agregar efectos visuales/sonoros
        // Por ejemplo: partículas, sonido de alerta, etc.
        
        switch(this.state) {
            case 'FRIENDLY':
                console.log('🟢 ¡Los NPCs ahora son AMISTOSOS!');
                break;
            case 'HOSTILE':
                console.log('🔴 ¡Los NPCs ahora son HOSTILES!');
                break;
            case 'NEUTRAL':
                console.log('🟡 Los NPCs ahora son NEUTRALES.');
                break;
        }
    }

    /**
     * Actualiza la UI del HUD
     */
    updateUI() {
        // Barra de progreso (mapear -100/100 a 0-100%)
        const percentage = ((this.points + 100) / 200) * 100;
        this.fillBar.style.width = `${percentage}%`;

        // Color de la barra
        const color = this.colors[this.state];
        this.fillBar.style.background = this.rgbToHex(color.r, color.g, color.b);

        // Texto del estado
        this.statusText.textContent = this.state;
        this.statusText.style.color = this.rgbToHex(color.r, color.g, color.b);
    }

    /**
     * Actualiza los colores de todos los NPCs registrados
     */
    updateNPCColors() {
        const targetColor = this.colors[this.state];

        this.npcMeshes.forEach(npc => {
            if (npc.material && npc.material.diffuseColor) {
                // Animación suave de color
                const current = npc.material.diffuseColor;
                const lerpFactor = 0.1;

                current.r += (targetColor.r - current.r) * lerpFactor;
                current.g += (targetColor.g - current.g) * lerpFactor;
                current.b += (targetColor.b - current.b) * lerpFactor;
            }
        });
    }

    /**
     * Convierte RGB (0-1) a Hexadecimal
     */
    rgbToHex(r, g, b) {
        const toHex = (val) => {
            const hex = Math.round(val * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Obtiene el estado actual
     */
    getState() {
        return this.state;
    }

    /**
     * Obtiene los puntos actuales
     */
    getPoints() {
        return this.points;
    }

    /**
     * Resetea el sistema (útil para testing)
     */
    reset() {
        this.points = 0;
        this.state = 'NEUTRAL';
        this.updateUI();
        
        // Restaurar colores originales de NPCs
        this.npcMeshes.forEach(npc => {
            if (npc.metadata && npc.metadata.originalColor) {
                npc.material.diffuseColor = npc.metadata.originalColor.clone();
            }
        });
    }
}