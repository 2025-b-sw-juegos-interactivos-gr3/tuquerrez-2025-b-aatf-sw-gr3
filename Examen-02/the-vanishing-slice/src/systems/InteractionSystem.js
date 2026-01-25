/**
 * INTERACTION SYSTEM
 * 
 * Detecta objetos interactuables usando Raycast
 * Muestra prompts de UI cuando el jugador mira un objeto interactuable
 * 
 * Patrón: Interface Pattern (Objetos con metadata.canInteract)
 */

export class InteractionSystem {
    constructor(scene, camera, dialogueSystem) {
        this.scene = scene;
        this.camera = camera;
        this.dialogueSystem = dialogueSystem;
        
        this.currentTarget = null;
        this.interactionRange = 3.5; // Metros
        
        // Referencias al DOM
        this.promptElement = document.getElementById('interact-prompt');
        
        // Bind del evento de teclado
        this.setupInputHandlers();
    }

    /**
     * Configura los controles de interacción
     */
    setupInputHandlers() {
        window.addEventListener('keydown', (event) => {
            // Tecla E para interactuar
            if (event.key === 'e' || event.key === 'E') {
                this.tryInteract();
            }

            // Tecla ESC para cerrar diálogo
            if (event.key === 'Escape') {
                if (this.dialogueSystem.getIsActive()) {
                    this.dialogueSystem.endDialogue();
                    this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), false); // Movimiento continuo con el mouse
                }
            }

            // Teclas numéricas (1-9) para opciones de diálogo
            const numKey = parseInt(event.key);
            if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
                this.dialogueSystem.handleNumberKey(numKey);
            }
        });
    }

    /**
     * Actualiza el sistema (llamar en el render loop)
     */
    update() {
        // No detectar si el diálogo está activo
        if (this.dialogueSystem.getIsActive()) {
            this.hidePrompt();
            return;
        }

        // Raycast desde la cámara
        const ray = this.camera.getForwardRay(this.interactionRange);
        const hit = this.scene.pickWithRay(ray);

        // Verificar si el objeto es interactuable
        if (hit.hit && hit.pickedMesh && this.isInteractable(hit.pickedMesh)) {
            this.currentTarget = hit.pickedMesh;
            this.showPrompt();
        } else {
            this.currentTarget = null;
            this.hidePrompt();
        }
    }

    /**
     * Verifica si un mesh es interactuable
     * @param {BABYLON.Mesh} mesh
     */
    isInteractable(mesh) {
        return mesh.metadata && mesh.metadata.canInteract === true;
    }

    /**
     * Intenta interactuar con el objeto actual
     */
    tryInteract() {
        if (!this.currentTarget) {
            console.log('[InteractionSystem] No hay objetivo para interactuar');
            return;
        }

        if (this.dialogueSystem.getIsActive()) {
            console.log('[InteractionSystem] Diálogo ya activo');
            return;
        }

        console.log(`[InteractionSystem] Interactuando con: ${this.currentTarget.name}`);

        // Obtener el tipo de interacción del metadata
        const interactionType = this.currentTarget.metadata.interactionType || 'dialogue';

        switch (interactionType) {
            case 'dialogue':
                this.startDialogue();
                break;
            case 'pickup':
                this.pickupItem();
                break;
            case 'examine':
                this.examineObject();
                break;
            default:
                console.warn(`Tipo de interacción desconocido: ${interactionType}`);
        }
    }

    /**
     * Inicia un diálogo con el NPC actual
     */
    startDialogue() {
        // Desactivar controles de cámara durante el diálogo
        this.camera.detachControl();

        // Obtener el nodo de diálogo del NPC
        const dialogueNode = this.currentTarget.metadata.dialogueNode || 'initial';
        
        console.log(`[InteractionSystem] Iniciando diálogo: ${dialogueNode}`);
        this.dialogueSystem.startDialogue(dialogueNode);
    }

    /**
     * Recoge un ítem (placeholder para futura expansión)
     */
    pickupItem() {
        console.log(`[InteractionSystem] Recogiendo: ${this.currentTarget.name}`);
        // Aquí iría la lógica del sistema de inventario
        this.currentTarget.dispose(); // Eliminar objeto de la escena
        this.hidePrompt();
    }

    /**
     * Examina un objeto (placeholder)
     */
    examineObject() {
        const description = this.currentTarget.metadata.description || 'Nothing special.';
        console.log(`[InteractionSystem] ${description}`);
        // Aquí podrías mostrar un tooltip o mensaje en pantalla
    }

    /**
     * Muestra el prompt de interacción
     */
    showPrompt() {
        if (this.promptElement.style.display !== 'block') {
            this.promptElement.style.display = 'block';
        }
    }

    /**
     * Oculta el prompt de interacción
     */
    hidePrompt() {
        if (this.promptElement.style.display !== 'none') {
            this.promptElement.style.display = 'none';
        }
    }

    /**
     * Limpia el sistema (llamar al destruir la escena)
     */
    dispose() {
        this.currentTarget = null;
        this.hidePrompt();
    }
}