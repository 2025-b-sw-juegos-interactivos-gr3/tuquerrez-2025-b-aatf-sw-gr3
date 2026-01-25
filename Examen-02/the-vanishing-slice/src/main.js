/**
 * THE VANISHING - VERTICAL SLICE
 * Examen Final - Implementación Técnica
 * 
 * Motor: Babylon.js
 * Mecánica Core: Sistema de Diálogo con Opciones Múltiples + Sistema de Relaciones
 * 
 * Arquitectura:
 * - DialogueSystem (State Machine)
 * - RelationshipSystem (Observer Pattern)
 * - InteractionSystem (Raycast Detection)
 * - SceneBuilder (Factory Pattern)
 */

import * as BABYLON from '@babylonjs/core';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { RelationshipSystem } from './systems/RelationshipSystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { SceneBuilder } from './utils/SceneBuilder.js';
import { dialogueData } from './data/dialogues.js';

// ===== VARIABLES GLOBALES =====
let engine;
let scene;
let camera;
let dialogueSystem;
let relationshipSystem;
let interactionSystem;

// ===== INICIALIZACIÓN =====
window.addEventListener('DOMContentLoaded', () => {
    initGame();
});

/**
 * Inicializa el juego completo
 */
async function initGame() {
    console.log('[INIT] Iniciando The Vanishing - Vertical Slice...');

    // Obtener canvas
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        console.error('Canvas no encontrado!');
        return;
    }

    // Crear motor Babylon
    engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
    });

    // Crear escena
    scene = createScene();

    // Ocultar loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        console.log('[INIT] Juego cargado exitosamente!');
    }, 1500);

    // Render loop
    engine.runRenderLoop(() => {
        // Actualizar sistemas
        if (interactionSystem) {
            interactionSystem.update();
        }

        if (relationshipSystem) {
            relationshipSystem.updateNPCColors();
        }

        scene.render();
    });

    // Responsive canvas
    window.addEventListener('resize', () => {
        engine.resize();
    });

    // Cleanup al cerrar
    window.addEventListener('beforeunload', () => {
        cleanup();
    });
}

/**
 * Crea la escena principal
 */
function createScene() {
    const newScene = new BABYLON.Scene(engine);
    newScene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.12);

    // ===== CÁMARA FPS =====
    camera = new BABYLON.UniversalCamera(
        'playerCamera',
        new BABYLON.Vector3(2.5, 1.8, -4.5), // Posición inicial cerca de la cama
        newScene
    );
    camera.setTarget(new BABYLON.Vector3(0, 1.6, 0));
    camera.attachControl(engine.getRenderingCanvas(), false); // Permitir movimiento continuo con el mouse

    // Configuración de controles FPS
    camera.speed = 0.15;
    camera.angularSensibility = 2000;
    camera.keysUp = [87];    // W
    camera.keysDown = [83];  // S
    camera.keysLeft = [65];  // A
    camera.keysRight = [68]; // D

    // Límites de rotación vertical (evitar mirar completamente arriba/abajo)
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.95;

    // Colisiones del jugador
    camera.checkCollisions = true;
    camera.applyGravity = true; // Activar gravedad para evitar que el personaje vuele
    camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5); // Cápsula de colisión

    // ===== SISTEMAS =====
    // 1. Sistema de Relaciones
    relationshipSystem = new RelationshipSystem(newScene);
    console.log('[INIT] Sistema de Relaciones inicializado');

    // 2. Sistema de Diálogos
    dialogueSystem = new DialogueSystem(dialogueData, relationshipSystem);
    console.log('[INIT] Sistema de Diálogos inicializado');

    // 3. Constructor de Escena
    const sceneBuilder = new SceneBuilder(newScene);
    sceneBuilder.buildRoom();
    console.log('[INIT] Escena construida (Greybox)');

    // 4. Crear NPCs
    const npcs = sceneBuilder.createNPCs(relationshipSystem);
    console.log(`[INIT] ${npcs.length} NPCs creados`);

    // Habilitar colisiones en toda la escena
    newScene.meshes.forEach(mesh => {
        if (mesh.name !== 'playerCamera') {
            mesh.checkCollisions = true;
        }
    });

    // 5. Sistema de Interacción
    interactionSystem = new InteractionSystem(newScene, camera, dialogueSystem);
    console.log('[INIT] Sistema de Interacción inicializado');

    // ===== INSTRUCCIONES INICIALES =====
    setTimeout(() => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║          THE VANISHING - VERTICAL SLICE v1.0              ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Controles:                                                ║
║    WASD      - Movimiento                                  ║
║    Mouse     - Mirar alrededor                             ║
║    E         - Interactuar con NPCs                        ║
║    1-9       - Seleccionar opción de diálogo               ║
║    ESC       - Cerrar diálogo                              ║
║                                                            ║
║  Objetivo:                                                 ║
║    Habla con Harold y Anna. Tus elecciones afectarán      ║
║    tu relación con ellos (mira la barra superior).         ║
║                                                            ║
║  Sistemas Implementados:                                   ║
║    ✓ Diálogo con ramificación (State Machine)             ║
║    ✓ Sistema de Relaciones (Visual Feedback)              ║
║    ✓ Detección por Raycast                                ║
║    ✓ Controles FPS                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        `);
    }, 2000);

    // ===== NIEBLA (ATMÓSFERA) =====
    newScene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    newScene.fogStart = 10;
    newScene.fogEnd = 25;
    newScene.fogColor = new BABYLON.Color3(0.15, 0.15, 0.18);
    newScene.fogDensity = 0.01;

    return newScene;
}

/**
 * Limpieza de recursos
 */
function cleanup() {
    console.log('[CLEANUP] Liberando recursos...');
    
    if (interactionSystem) {
        interactionSystem.dispose();
    }

    if (scene) {
        scene.dispose();
    }

    if (engine) {
        engine.dispose();
    }
}

/**
 * DEBUGGING: Funciones expuestas globalmente para testing
 */
if (process.env.NODE_ENV === 'development') {
    window.DEBUG = {
        resetRelationship: () => relationshipSystem?.reset(),
        addRelationship: (amount) => relationshipSystem?.addPoints(amount),
        getRelationship: () => relationshipSystem?.getPoints(),
        startDialogue: (nodeId) => dialogueSystem?.startDialogue(nodeId),
        getCamera: () => camera,
        getScene: () => scene
    };

    console.log('[DEBUG] Funciones de depuración disponibles en window.DEBUG');
}