/**
 * SCENE BUILDER (ACTUALIZADO: Puerta, Mesa alejada y Silla enfrentada)
 */

import * as BABYLON from '@babylonjs/core';

export class SceneBuilder {
    constructor(scene) {
        this.scene = scene;
    }

    buildRoom() {
        this.createLighting();
        this.createFloor();
        this.createWalls();
        this.createCeiling();
        this.createFurniture();
        this.createDoor(); 

        return this.scene;
    }

    createLighting() {
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.6;
        hemiLight.groundColor = new BABYLON.Color3(0.3, 0.25, 0.2);

        const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-0.5, -1, 0.5), this.scene);
        sunLight.intensity = 0.7;
        sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
    }

    createFloor() {
        const ground = BABYLON.MeshBuilder.CreateGround('floor', { width: 10, height: 10 }, this.scene);
        const floorMat = new BABYLON.StandardMaterial('floorMat', this.scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        ground.material = floorMat;
        return ground;
    }

    createWalls() {
        const wallMat = new BABYLON.StandardMaterial('wallMat', this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.85, 0.8, 0.75);

        const wallConfigs = [
            { name: 'backWall', position: [0, 2, 5], size: [10, 4, 0.2] },
            { name: 'leftWall', position: [-5, 2, 0], size: [0.2, 4, 10] },
            { name: 'rightWall', position: [5, 2, 0], size: [0.2, 4, 10] },
            { name: 'frontWall', position: [0, 2, -5], size: [10, 4, 0.2] }
        ];

        wallConfigs.forEach(config => {
            const wall = BABYLON.MeshBuilder.CreateBox(config.name, {
                width: config.size[0], height: config.size[1], depth: config.size[2]
            }, this.scene);
            wall.position = new BABYLON.Vector3(...config.position);
            wall.material = wallMat;
        });
    }

    createCeiling() {
        const ceiling = BABYLON.MeshBuilder.CreateBox('ceiling', { width: 10, height: 0.2, depth: 10 }, this.scene);
        ceiling.position.y = 4;
        const ceilingMat = new BABYLON.StandardMaterial('ceilingMat', this.scene);
        ceilingMat.diffuseColor = new BABYLON.Color3(0.9, 0.88, 0.85);
        ceiling.material = ceilingMat;
    }

    createFurniture() {
        this.createBed();
        this.createTable();
        this.createChair();
        this.createWindow();
    }

    createBed() {
        const bedPos = new BABYLON.Vector3(3.5, 0, -3); // Esquina derecha trasera
        
        const bedFrame = BABYLON.MeshBuilder.CreateBox('bedFrame', { width: 2.2, height: 0.4, depth: 3.2 }, this.scene);
        bedFrame.position = new BABYLON.Vector3(bedPos.x, 0.2, bedPos.z);
        const frameMat = new BABYLON.StandardMaterial('frameMat', this.scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.15);
        bedFrame.material = frameMat;

        const mattress = BABYLON.MeshBuilder.CreateBox('mattress', { width: 2, height: 0.3, depth: 3 }, this.scene);
        mattress.position = new BABYLON.Vector3(bedPos.x, 0.55, bedPos.z);
        const mattressMat = new BABYLON.StandardMaterial('mattressMat', this.scene);
        mattressMat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
        mattress.material = mattressMat;

        const pillow = BABYLON.MeshBuilder.CreateBox('pillow', { width: 0.6, height: 0.15, depth: 0.4 }, this.scene);
        pillow.position = new BABYLON.Vector3(bedPos.x, 0.775, bedPos.z - 1.2);
        const pillowMat = new BABYLON.StandardMaterial('pillowMat', this.scene);
        pillowMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.85);
        pillow.material = pillowMat;
    }

    createTable() {
        const tableMat = new BABYLON.StandardMaterial('tableMat', this.scene);
        tableMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.2);

        const tableTop = BABYLON.MeshBuilder.CreateBox('tableTop', { width: 2, height: 0.1, depth: 1.2 }, this.scene);
        // Alejada de la cama (x: -2)
        tableTop.position = new BABYLON.Vector3(-2, 0.8, -1.5); 
        tableTop.material = tableMat;

        const legPositions = [[-0.8, -0.4, -0.4], [0.8, -0.4, -0.4], [-0.8, -0.4, 0.4], [0.8, -0.4, 0.4]];
        legPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(`tableLeg${index}`, { height: 0.8, diameter: 0.1 }, this.scene);
            leg.parent = tableTop;
            leg.position = new BABYLON.Vector3(...pos);
            leg.material = tableMat;
        });
    }

    createChair() {
        const chairMat = new BABYLON.StandardMaterial('chairMat', this.scene);
        chairMat.diffuseColor = new BABYLON.Color3(0.35, 0.25, 0.2);

        const seat = BABYLON.MeshBuilder.CreateBox('chairSeat', { width: 0.6, height: 0.1, depth: 0.6 }, this.scene);
        // Colocada frente a la mesa (z un poco más atrás de la mesa)
        seat.position = new BABYLON.Vector3(-2, 0.5, -2.8);
        seat.rotation.y = Math.PI; // Rotada 180 grados para mirar hacia la mesa
        seat.material = chairMat;

        const back = BABYLON.MeshBuilder.CreateBox('chairBack', { width: 0.6, height: 0.7, depth: 0.1 }, this.scene);
        back.parent = seat;
        back.position = new BABYLON.Vector3(0, 0.35, 0.25);
        back.material = chairMat;

        const legPositions = [[-0.25, -0.3, -0.25], [0.25, -0.3, -0.25], [-0.25, -0.3, 0.25], [0.25, -0.3, 0.25]];
        legPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(`chairLeg${index}`, { height: 0.5, diameter: 0.05 }, this.scene);
            leg.parent = seat;
            leg.position = new BABYLON.Vector3(...pos);
            leg.material = chairMat;
        });
    }

    createWindow() {
        const windowFrame = BABYLON.MeshBuilder.CreateBox('window', { width: 2, height: 1.5, depth: 0.1 }, this.scene);
        windowFrame.position = new BABYLON.Vector3(4.9, 2.2, 0);
        windowFrame.rotation.y = Math.PI / 2;
        const windowMat = new BABYLON.StandardMaterial('windowMat', this.scene);
        windowMat.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1);
        windowFrame.material = windowMat;
    }

    createDoor() {
        // Marco de la puerta
        const doorFrame = BABYLON.MeshBuilder.CreateBox('doorFrame', { width: 1.2, height: 2.2, depth: 0.1 }, this.scene);
        doorFrame.position = new BABYLON.Vector3(-4.9, 1.1, 3); // En la pared izquierda
        doorFrame.rotation.y = Math.PI / 2;

        const doorMat = new BABYLON.StandardMaterial('doorMat', this.scene);
        doorMat.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.05); // Madera muy oscura
        doorFrame.material = doorMat;

        // Pomo de la puerta (detalle opcional)
        const knob = BABYLON.MeshBuilder.CreateSphere('knob', { diameter: 0.1 }, this.scene);
        knob.parent = doorFrame;
        knob.position = new BABYLON.Vector3(0.4, 0, -0.1);
        knob.material = new BABYLON.StandardMaterial('knobMat', this.scene);
        knob.material.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.2); // Dorado
    }

    createNPCs(relationshipSystem) {
        return [
            this.createNPC('Harold', [1, 0, 1], relationshipSystem),
            this.createNPC('Anna', [-1, 0, 3], relationshipSystem)
        ];
    }

    createNPC(name, position, relationshipSystem) {
        const body = BABYLON.MeshBuilder.CreateCapsule(`${name}_body`, { height: 1.8, radius: 0.35 }, this.scene);
        body.position = new BABYLON.Vector3(position[0], 0.9, position[2]);
        const npcMat = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
        npcMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.9);
        body.material = npcMat;

        const head = BABYLON.MeshBuilder.CreateSphere(`${name}_head`, { diameter: 0.5 }, this.scene);
        head.parent = body;
        head.position = new BABYLON.Vector3(0, 1.0, 0);
        head.material = npcMat;

        body.metadata = { name, canInteract: true, interactionType: 'dialogue' };
        relationshipSystem.registerNPC(body);
        return body;
    }
}