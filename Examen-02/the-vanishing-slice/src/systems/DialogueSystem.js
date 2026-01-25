/**
 * DIALOGUE SYSTEM
 * Patrón de Diseño: State Machine
 * 
 * Responsabilidades:
 * - Gestionar el estado actual del diálogo
 * - Renderizar texto y opciones en el DOM
 * - Transiciones entre nodos de diálogo
 * - Comunicarse con RelationshipSystem
 */

export class DialogueSystem {
    constructor(dialogueData, relationshipSystem) {
        this.dialogueData = dialogueData;
        this.relationshipSystem = relationshipSystem;
        this.currentNodeId = null;
        this.isActive = false;

        // Referencias al DOM
        this.dialogueBox = document.getElementById('dialogue-box');
        this.speakerElement = document.getElementById('dialogue-speaker');
        this.textElement = document.getElementById('dialogue-text');
        this.optionsContainer = document.getElementById('dialogue-options');
    }

    /**
     * Inicia un diálogo desde un nodo específico
     * @param {string} nodeId - ID del nodo inicial (ej: 'initial')
     */
    startDialogue(nodeId = 'initial') {
        if (!this.dialogueData[nodeId]) {
            console.error(`Nodo de diálogo no encontrado: ${nodeId}`);
            return;
        }

        this.currentNodeId = nodeId;
        this.isActive = true;
        this.renderCurrentNode();
        this.show();
    }

    /**
     * Renderiza el nodo actual en el DOM
     */
    renderCurrentNode() {
        const node = this.dialogueData[this.currentNodeId];
        
        // Actualizar speaker y texto con efecto de escritura
        this.speakerElement.textContent = node.speaker;
        this.typeWriter(node.text);

        // Limpiar opciones anteriores
        this.optionsContainer.innerHTML = '';

        // Si no hay opciones, es un nodo final
        if (node.options.length === 0) {
            this.showContinueButton();
        } else {
            // Renderizar opciones disponibles
            node.options.forEach((option, index) => {
                const button = this.createOptionButton(option, index);
                this.optionsContainer.appendChild(button);
            });
        }
    }

    /**
     * Crea un botón de opción de diálogo
     * @param {Object} option - Datos de la opción
     * @param {number} index - Índice de la opción
     */
    createOptionButton(option, index) {
        const button = document.createElement('button');
        button.className = 'dialogue-option';
        button.textContent = option.text;
        button.setAttribute('data-index', index);

        button.addEventListener('click', () => {
            this.selectOption(index);
        });

        // Accesibilidad: hotkeys numéricas
        button.setAttribute('data-hotkey', index + 1);

        return button;
    }

    /**
     * Maneja la selección de una opción
     * @param {number} optionIndex - Índice de la opción seleccionada
     */
    selectOption(optionIndex) {
        const node = this.dialogueData[this.currentNodeId];
        const option = node.options[optionIndex];

        if (!option) {
            console.error(`Opción inválida: ${optionIndex}`);
            return;
        }

        // Aplicar cambio de relación
        if (option.relationshipChange !== 0) {
            this.relationshipSystem.addPoints(option.relationshipChange);
        }

        // Transición al siguiente nodo
        if (option.next) {
            this.currentNodeId = option.next;
            this.renderCurrentNode();
        } else {
            // Si no hay siguiente nodo, cerrar diálogo
            this.endDialogue();
        }
    }

    /**
     * Muestra botón de "Continuar" para nodos finales
     */
    showContinueButton() {
        const button = document.createElement('button');
        button.className = 'dialogue-option';
        button.textContent = '[Continuar]';
        button.style.textAlign = 'center';
        button.style.fontStyle = 'italic';

        button.addEventListener('click', () => {
            this.endDialogue();
        });

        this.optionsContainer.appendChild(button);

        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            if (this.isActive) {
                this.endDialogue();
            }
        }, 3000);
    }

    /**
     * Efecto de máquina de escribir para el texto
     * @param {string} text - Texto a mostrar
     */
    typeWriter(text, speed = 30) {
        this.textElement.textContent = '';
        let index = 0;

        const type = () => {
            if (index < text.length) {
                this.textElement.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            }
        };

        type();
    }

    /**
     * Finaliza el diálogo actual
     */
    endDialogue() {
        this.isActive = false;
        this.currentNodeId = null;
        this.hide();
    }

    /**
     * Muestra la UI del diálogo
     */
    show() {
        this.dialogueBox.style.display = 'block';
        document.getElementById('interact-prompt').style.display = 'none';
    }

    /**
     * Oculta la UI del diálogo
     */
    hide() {
        this.dialogueBox.style.display = 'none';
    }

    /**
     * Verifica si el diálogo está activo
     */
    getIsActive() {
        return this.isActive;
    }

    /**
     * Manejo de teclas numéricas (1-9) para seleccionar opciones
     */
    handleNumberKey(number) {
        if (!this.isActive) return;

        const node = this.dialogueData[this.currentNodeId];
        const optionIndex = number - 1;

        if (node.options[optionIndex]) {
            this.selectOption(optionIndex);
        }
    }
}