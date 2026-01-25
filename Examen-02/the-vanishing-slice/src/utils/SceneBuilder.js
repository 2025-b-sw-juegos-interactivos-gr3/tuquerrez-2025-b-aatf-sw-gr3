/**
 * SCENE BUILDER
 * 
 * Construye el entorno 3D (Greybox) de la habitación inicial
 * Basado en el Panel 2 del Storyboard del GDD
 */

import * as BABYLON from '@babylonjs/core';

export class SceneBuilder {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Construye la habitación completa
     */
    buildRoom() {
        this.createLighting();
        this.createFloor();
        this.createWalls();
        this.createCeiling();
        this.createFurniture();
        
        return this.scene;
    }

    /**
     * Sistema de iluminación
     */
    createLighting() {
        // Luz hemisférica (ambiente)
        const hemiLight = new BABYLON.HemisphericLight(
            'hemiLight',
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.6;
        hemiLight.groundColor = new BABYLON.Color3(0.3, 0.25, 0.2);

        // Luz direccional (sol a través de la ventana)
        const sunLight = new BABYLON.DirectionalLight(
            'sunLight',
            new BABYLON.Vector3(-0.5, -1, 0.5),
            this.scene
        );
        sunLight.intensity = 0.7;
        sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8); // Luz cálida
    }

    /**
     * Suelo de madera
     */
    createFloor() {
        const ground = BABYLON.MeshBuilder.CreateGround(
            'floor',
            { width: 10, height: 10 },
            this.scene
        );

        const floorMat = new BABYLON.StandardMaterial('floorMat', this.scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2); // Madera oscura
        floorMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = floorMat;

        ground.receiveShadows = true;
        return ground;
    }

    /**
     * Paredes de la habitación
     */
    createWalls() {
        const wallMat = new BABYLON.StandardMaterial('wallMat', this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.85, 0.8, 0.75); // Beige claro
        wallMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

        const wallConfigs = [
            { name: 'backWall', position: [0, 2, 5], size: [10, 4, 0.2] },
            { name: 'leftWall', position: [-5, 2, 0], size: [0.2, 4, 10] },
            { name: 'rightWall', position: [5, 2, 0], size: [0.2, 4, 10] },
            { name: 'frontWall', position: [0, 2, -5], size: [10, 4, 0.2] }
        ];

        wallConfigs.forEach(config => {
            const wall = BABYLON.MeshBuilder.CreateBox(
                config.name,
                {
                    width: config.size[0],
                    height: config.size[1],
                    depth: config.size[2]
                },
                this.scene
            );
            wall.position = new BABYLON.Vector3(...config.position);
            wall.material = wallMat;
            wall.receiveShadows = true;
        });
    }

    /**
     * Techo
     */
    createCeiling() {
        const ceiling = BABYLON.MeshBuilder.CreateBox(
            'ceiling',
            { width: 10, height: 0.2, depth: 10 },
            this.scene
        );
        ceiling.position.y = 4;

        const ceilingMat = new BABYLON.StandardMaterial('ceilingMat', this.scene);
        ceilingMat.diffuseColor = new BABYLON.Color3(0.9, 0.88, 0.85);
        ceiling.material = ceilingMat;

        return ceiling;
    }

    /**
     * Mobiliario de la habitación
     */
    createFurniture() {
        this.createBed();
        this.createTable();
        this.createChair();
        this.createWindow();
    }

    /**
     * Cama donde despierta el jugador
     */
    createBed() {
        // Base de la cama
        const bedFrame = BABYLON.MeshBuilder.CreateBox(
            'bedFrame',
            { width: 2.2, height: 0.4, depth: 3.2 },
            this.scene
        );
        bedFrame.position = new BABYLON.Vector3(0, 0.2, -3);

        const frameMat = new BABYLON.StandardMaterial('frameMat', this.scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.15); // Madera oscura
        bedFrame.material = frameMat;

        // Colchón
        const mattress = BABYLON.MeshBuilder.CreateBox(
            'mattress',
            { width: 2, height: 0.3, depth: 3 },
            this.scene
        );
        mattress.position = new BABYLON.Vector3(0, 0.55, -3);

        const mattressMat = new BABYLON.StandardMaterial('mattressMat', this.scene);
        mattressMat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4); // Beige
        mattress.material = mattressMat;

        // Almohada
        const pillow = BABYLON.MeshBuilder.CreateBox(
            'pillow',
            { width: 0.6, height: 0.15, depth: 0.4 },
            this.scene
        );
        pillow.position = new BABYLON.Vector3(0, 0.775, -4);

        const pillowMat = new BABYLON.StandardMaterial('pillowMat', this.scene);
        pillowMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.85);
        pillow.material = pillowMat;
    }

    /**
     * Mesa simple
     */
    createTable() {
        // Superficie de la mesa
        const tableTop = BABYLON.MeshBuilder.CreateBox(
            'tableTop',
            { width: 2, height: 0.1, depth: 1 },
            this.scene
        );
        tableTop.position = new BABYLON.Vector3(0, 0.75, -2);

        const tableMat = new BABYLON.StandardMaterial('tableMat', this.scene);
        tableMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.2);
        tableTop.material = tableMat;

        // Patas de la mesa
        const legPositions = [
            [-0.6, 0.4, -1.65],
            [0.6, 0.4, -1.65],
            [-0.6, 0.4, -0.35],
            [0.6, 0.4, -0.35]
        ];

        legPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(
                `tableLeg${index}`,
                { height: 0.8, diameter: 0.08 },
                this.scene
            );
            leg.position = new BABYLON.Vector3(...pos);
            leg.material = tableMat;
        });
    }

    /**
     * Silla simple
     */
    createChair() {
        // Asiento
        const seat = BABYLON.MeshBuilder.CreateBox(
            'chairSeat',
            { width: 0.5, height: 0.05, depth: 0.5 },
            this.scene
        );
        seat.position = new BABYLON.Vector3(-2.5, 0.5, 1);

        const chairMat = new BABYLON.StandardMaterial('chairMat', this.scene);
        chairMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.2);
        seat.material = chairMat;

        // Respaldo
        const back = BABYLON.MeshBuilder.CreateBox(
            'chairBack',
            { width: 0.5, height: 0.6, depth: 0.05 },
            this.scene
        );
        back.position = new BABYLON.Vector3(-2.5, 0.8, 1.225);
        back.material = chairMat;

        // Patas (simplificadas)
        const chairLegPositions = [
            [-2.65, 0.25, 0.85],
            [-2.35, 0.25, 0.85],
            [-2.65, 0.25, 1.15],
            [-2.35, 0.25, 1.15]
        ];

        chairLegPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(
                `chairLeg${index}`,
                { height: 0.5, diameter: 0.05 },
                this.scene
            );
            leg.position = new BABYLON.Vector3(...pos);
            leg.material = chairMat;
        });
    }

    /**
     * Ventana simulada con luz
     */
    createWindow() {
        const windowFrame = BABYLON.MeshBuilder.CreateBox(
            'window',
            { width: 2, height: 2, depth: 0.15 },
            this.scene
        );
        windowFrame.position = new BABYLON.Vector3(4.93, 2.5, 2);

        const windowMat = new BABYLON.StandardMaterial('windowMat', this.scene);
        windowMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 1); // Azul claro (cielo)
        windowMat.emissiveColor = new BABYLON.Color3(0.3, 0.4, 0.5); // Brillo propio
        windowFrame.material = windowMat;

        return windowFrame;
    }

    /**
     * Crea NPCs interactuables
     * @param {RelationshipSystem} relationshipSystem
     */
    createNPCs(relationshipSystem) {
        const npcs = [];

        // Harold Greenfield (Guardia del pueblo)
        const harold = this.createNPC('Harold', [2.5, 0, 2], relationshipSystem);
        harold.metadata.dialogueNode = 'initial';
        npcs.push(harold);

        // Anna Greenfield (Esposa de Harold)
        const anna = this.createNPC('Anna', [-2.5, 0, 2.5], relationshipSystem);
        anna.metadata.dialogueNode = 'initial';
        npcs.push(anna);

        return npcs;
    }

    /**
     * Crea un NPC con cuerpo y cabeza
     */
    createNPC(name, position, relationshipSystem) {
        // Cuerpo (cápsula)
        const body = BABYLON.MeshBuilder.CreateCapsule(
            `${name}_body`,
            { height: 1.8, radius: 0.35 },
            this.scene
        );
        body.position = new BABYLON.Vector3(position[0], 0.9, position[2]);

        // Material del NPC
        const npcMat = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
        npcMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.8); // Azul neutral
        body.material = npcMat;

        // Cabeza
        const head = BABYLON.MeshBuilder.CreateSphere(
            `${name}_head`,
            { diameter: 0.45 },
            this.scene
        );
        head.position = new BABYLON.Vector3(position[0], 1.95, position[2]);
        head.material = npcMat;

        // Metadata para interacción
        body.metadata = {
            name: name,
            canInteract: true,
            interactionType: 'dialogue',
            dialogueNode: 'initial'
        };

        // Registrar en el sistema de relaciones
        relationshipSystem.registerNPC(body);

        // Parent la cabeza al cuerpo
        head.parent = body;

        return body;
    }
}