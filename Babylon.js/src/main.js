const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Velocidad del jugador (unidades por segundo)
export let PLAYER_SPEED = 4;
export function setPlayerSpeed(v) { PLAYER_SPEED = v; }

/**
 * Crea un personaje humano simple usando nodos articulados (TransformNode) y
 * meshes parentadas a esos nodos. Las articulaciones se rotan para simular
 * caminata cuando el personaje se mueve.
 */
function createHumanoidWithJoints(scene) {
    const root = new BABYLON.TransformNode("playerRoot", scene);

    // Joints (TransformNodes) — colocados en el origen de rotación de cada parte
    const hip = new BABYLON.TransformNode("hip", scene);
    hip.parent = root;
    hip.position = new BABYLON.Vector3(0, 0.9, 0);

    const spine = new BABYLON.TransformNode("spine", scene);
    spine.parent = hip;
    spine.position = new BABYLON.Vector3(0, 0.6, 0);

    const neck = new BABYLON.TransformNode("neck", scene);
    neck.parent = spine;
    neck.position = new BABYLON.Vector3(0, 0.6, 0);

    const head = new BABYLON.TransformNode("head", scene);
    head.parent = neck;
    head.position = new BABYLON.Vector3(0, 0.3, 0);

    // Brazos
    const leftShoulder = new BABYLON.TransformNode("leftShoulder", scene);
    leftShoulder.parent = spine;
    leftShoulder.position = new BABYLON.Vector3(-0.45, 0.5, 0);

    const leftElbow = new BABYLON.TransformNode("leftElbow", scene);
    leftElbow.parent = leftShoulder;
    leftElbow.position = new BABYLON.Vector3(0, -0.5, 0);

    const rightShoulder = new BABYLON.TransformNode("rightShoulder", scene);
    rightShoulder.parent = spine;
    rightShoulder.position = new BABYLON.Vector3(0.45, 0.5, 0);

    const rightElbow = new BABYLON.TransformNode("rightElbow", scene);
    rightElbow.parent = rightShoulder;
    rightElbow.position = new BABYLON.Vector3(0, -0.5, 0);

    // Piernas
    const leftHip = new BABYLON.TransformNode("leftHip", scene);
    leftHip.parent = hip;
    leftHip.position = new BABYLON.Vector3(-0.25, -0.1, 0);

    const leftKnee = new BABYLON.TransformNode("leftKnee", scene);
    leftKnee.parent = leftHip;
    leftKnee.position = new BABYLON.Vector3(0, -0.7, 0);

    const rightHip = new BABYLON.TransformNode("rightHip", scene);
    rightHip.parent = hip;
    rightHip.position = new BABYLON.Vector3(0.25, -0.1, 0);

    const rightKnee = new BABYLON.TransformNode("rightKnee", scene);
    rightKnee.parent = rightHip;
    rightKnee.position = new BABYLON.Vector3(0, -0.7, 0);

    // Crear meshes simples y parentarlos a los joints; usar pivotes para que roten en la articulación
    const mat = new BABYLON.StandardMaterial("playerMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.8); // Azul medio
    mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Brillo suave
    mat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2); // Emisión sutil

    // Torso
    const torso = BABYLON.MeshBuilder.CreateBox("torso", {height: 1.0, width: 0.6, depth: 0.35}, scene);
    torso.material = mat;
    torso.parent = spine;
    torso.position = new BABYLON.Vector3(0, 0.25, 0);

    // Cabeza
    const headMesh = BABYLON.MeshBuilder.CreateSphere("headMesh", {diameter: 0.35}, scene);
    headMesh.material = mat;
    headMesh.parent = head;
    headMesh.position = new BABYLON.Vector3(0, 0.2, 0);

    // Brazos (upper + lower)
    const upperArmL = BABYLON.MeshBuilder.CreateBox("upperArmL", {height:0.5, width:0.2, depth:0.2}, scene);
    upperArmL.material = mat; upperArmL.parent = leftShoulder; upperArmL.position = new BABYLON.Vector3(0, -0.25, 0);
    const lowerArmL = BABYLON.MeshBuilder.CreateBox("lowerArmL", {height:0.5, width:0.18, depth:0.18}, scene);
    lowerArmL.material = mat; lowerArmL.parent = leftElbow; lowerArmL.position = new BABYLON.Vector3(0, -0.25, 0);

    const upperArmR = upperArmL.clone("upperArmR"); upperArmR.parent = rightShoulder; upperArmR.position = new BABYLON.Vector3(0, -0.25, 0);
    const lowerArmR = lowerArmL.clone("lowerArmR"); lowerArmR.parent = rightElbow; lowerArmR.position = new BABYLON.Vector3(0, -0.25, 0);

    // Piernas
    const upperLegL = BABYLON.MeshBuilder.CreateBox("upperLegL", {height:0.7, width:0.25, depth:0.25}, scene);
    upperLegL.material = mat; upperLegL.parent = leftHip; upperLegL.position = new BABYLON.Vector3(0, -0.35, 0);
    const lowerLegL = BABYLON.MeshBuilder.CreateBox("lowerLegL", {height:0.7, width:0.22, depth:0.22}, scene);
    lowerLegL.material = mat; lowerLegL.parent = leftKnee; lowerLegL.position = new BABYLON.Vector3(0, -0.35, 0);

    const upperLegR = upperLegL.clone("upperLegR"); upperLegR.parent = rightHip; upperLegR.position = new BABYLON.Vector3(0, -0.35, 0);
    const lowerLegR = lowerLegL.clone("lowerLegR"); lowerLegR.parent = rightKnee; lowerLegR.position = new BABYLON.Vector3(0, -0.35, 0);

    // Agrupar referencias útiles
    const joints = {
        root, hip, spine, neck, head,
        leftShoulder, leftElbow, rightShoulder, rightElbow,
        leftHip, leftKnee, rightHip, rightKnee
    };

    return { root, joints };
}

/**
 * Crea la escena con solo el suelo y el personaje humano articulado.
 */
function createScene() {
    const scene = new BABYLON.Scene(engine);

    // Cámara en tercera persona: creamos una FreeCamera y la posicionamos detrás
    // del jugador manualmente cada frame (sin control del usuario).
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 2.2, -5), scene);
    // No attachControl: el jugador no debe controlar la cámara con el ratón

    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene);
    hemi.intensity = 0.9;
    const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1,-2,-1), scene);
    dir.position = new BABYLON.Vector3(5,10,5);

    // Suelo grande. Usaremos un DynamicTexture para pintar una mezcla de césped y
    // un camino central, de forma armónica.
    const groundSize = 60;
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:groundSize, height:groundSize}, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);

    // Dynamic texture (canvas) donde dibujamos césped y camino
    const dtSize = 2048;
    const dynTex = new BABYLON.DynamicTexture("groundDT", dtSize, scene, false);
    const ctx = dynTex.getContext();

    // Dibujar fondo de césped (gradiente verde) y ruido para parecer real
    const grd = ctx.createLinearGradient(0, 0, 0, dtSize);
    grd.addColorStop(0, '#6fbf4f');
    grd.addColorStop(1, '#4a8b2b');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, dtSize, dtSize);

    // Añadir ruido sutil para textura de césped
    for (let i = 0; i < 12000; i++) {
        const x = Math.random() * dtSize;
        const y = Math.random() * dtSize;
        const r = Math.random() * 1.5;
        const g = 80 + Math.floor(Math.random() * 70);
        const b = 40 + Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${r},${g},${b},${(Math.random()*0.08)+0.02})`;
        ctx.fillRect(x, y, 1, 1);
    }

    // Dibujar un camino central (rectángulo con bordes desgastados)
    const pathWidthRatio = 0.18; // 18% del ancho del terreno
    const pathPx = Math.floor(dtSize * pathWidthRatio);
    const centerX = dtSize / 2;

    // Dibujar recta vertical (a lo largo del eje Z) en el centro
    ctx.fillStyle = '#8b6b4a'; // tono tierra / camino
    ctx.fillRect(centerX - pathPx/2, 0, pathPx, dtSize);

    // Bordes desgastados: dibujar líneas y manchas
    ctx.fillStyle = 'rgba(100,70,50,0.25)';
    for (let i = 0; i < 800; i++) {
        const x = centerX - pathPx/2 - 30 + Math.random() * (pathPx + 60);
        const y = Math.random() * dtSize;
        const w = 2 + Math.random()*6;
        const h = 2 + Math.random()*6;
        ctx.fillRect(x, y, w, h);
    }

    // Añadir algunas piedras (pequeños círculos) sobre el camino
    for (let i = 0; i < 1200; i++) {
        const x = centerX - pathPx/2 + Math.random() * pathPx;
        const y = Math.random() * dtSize;
        const r = 0.5 + Math.random()*2.2;
        ctx.fillStyle = `rgba(180,180,180,${0.2 + Math.random()*0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }

    // Oscurecer ligeramente alrededor de los bordes del mapa para profundidad
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, dtSize, 30);
    ctx.fillRect(0, dtSize-30, dtSize, 30);
    ctx.fillRect(0, 0, 30, dtSize);
    ctx.fillRect(dtSize-30, 0, 30, dtSize);

    dynTex.update();
    groundMat.diffuseTexture = dynTex;
    groundMat.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
    ground.material = groundMat;

    // Guardar parámetros del camino para posicionamiento de cofres
    const pathHalfWidth = (groundSize * pathWidthRatio) / 2; // en unidades del mundo
    // Material para cofres con textura Cofre
    const chestMat = new BABYLON.StandardMaterial("cofreMat", scene);
    chestMat.diffuseTexture = new BABYLON.Texture("assets/textures/Cofre.jpg", scene);
    chestMat.specularColor = new BABYLON.Color3(0.2,0.2,0.2);

    // Función utilitaria para crear un cofre con ligera variación aleatoria en rotación
    function createChest(x, y, z, idx) {
        const chestWidth = 1.4;    // Aumentado más
        const chestHeight = 1.1;   // Aumentado más
        const chestDepth = 1.1;    // Aumentado más
        const box = BABYLON.MeshBuilder.CreateBox(`chest_body_${idx}`, {width: chestWidth, height: chestHeight, depth: chestDepth}, scene);
        box.material = chestMat;
        box.position = new BABYLON.Vector3(x, y + chestHeight/2, z);
        
        // Rotación aleatoria sutil en Y para que parezca colocado a mano
        box.rotation.y = (Math.random() - 0.5) * 0.4;
        
        // tapa levemente más pequeña y un poco desplazada hacia arriba
        const lid = BABYLON.MeshBuilder.CreateBox(`chest_lid_${idx}`, {width: chestWidth*0.98, height: chestHeight*0.4, depth: chestDepth*0.98}, scene);
        lid.material = chestMat;
        lid.parent = box;
        lid.position = new BABYLON.Vector3(0, chestHeight*0.3, 0);

        return box;
    }

    // Crear una pila de cofres en una ubicación específica (lejos del camino)
    const chests = [];
    // Posición base de la pila (en el cuadrante positivo X, negativo Z)
    const pileX = 15;  // lejos del camino central
    const pileZ = -10;

    // Primer nivel: 3 cofres en triángulo
    chests.push(createChest(pileX, 0, pileZ, 0));
    chests.push(createChest(pileX - 1.2, 0, pileZ + 1, 1));
    chests.push(createChest(pileX + 0.8, 0, pileZ + 0.9, 2));

    // Segundo nivel: 2 cofres
    chests.push(createChest(pileX - 0.3, 1.0, pileZ + 0.5, 3));
    chests.push(createChest(pileX + 0.4, 1.1, pileZ - 0.2, 4));

    // Un cofre en la cima, ligeramente inclinado
    const topChest = createChest(pileX, 2.1, pileZ + 0.3, 5);
    topChest.rotation.x = 0.1;  // ligera inclinación para que parezca inestable

    // Crear personaje
    const { root: playerRoot, joints } = createHumanoidWithJoints(scene);

    // Mesh controlador (player body) — usamos un mesh para manejar posición/rotación
    // y que la cámara pueda apuntar a él. Lo hacemos invisible.
    const playerBody = BABYLON.MeshBuilder.CreateBox("playerBody", {height:1.8, width:0.6, depth:0.6}, scene);
    playerBody.isVisible = false;
    playerBody.position = new BABYLON.Vector3(0, 0, 2);

    // Parentar el humano al body para que herede posición y rotación
    playerRoot.parent = playerBody;
    // Mantener root en origen local del body
    playerRoot.position = new BABYLON.Vector3(0, 0, 0);

    // Entrada WASD
    const inputMap = {};
    scene.onKeyboardObservable.add((kbInfo) => {
        const key = kbInfo.event.key.toLowerCase();
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) inputMap[key]=true;
        else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) inputMap[key]=false;
    });

    // Animación básica de caminata: oscila piernas y brazos
    let walkTimer = 0;

    scene.registerBeforeRender(() => {
        const dt = engine.getDeltaTime() / 1000;
        let forward = 0, right = 0;
        if (inputMap['w']) forward += 1;
        if (inputMap['a']) right -= 1;
        if (inputMap['d']) right += 1;

        const moving = (forward !== 0 || right !== 0);

        // Movimiento del body (mundo) y rotación hacia la dirección de movimiento
        if (moving) {
            // Vector de entrada en espacio local del jugador (Z = adelante del jugador)
            const localInput = new BABYLON.Vector3(right, 0, forward);
            // Rotar ese vector por el yaw actual para obtener la dirección en mundo
            const rotMat = BABYLON.Matrix.RotationY(playerBody.rotation.y);
            let worldDir = BABYLON.Vector3.TransformCoordinates(localInput, rotMat);
            const len = worldDir.length();
            if (len > 0) worldDir.scaleInPlace(1/len);

            // Mover el mesh controlador en la dirección transformada
            const delta = worldDir.scale(PLAYER_SPEED * dt);
            playerBody.position.addInPlace(delta);

            // Calcular ángulo deseado (yaw) hacia la dirección de movimiento en mundo
            const desiredYaw = Math.atan2(worldDir.x, worldDir.z);
            // Interpolar rotación suavemente
            const currentYaw = playerBody.rotation.y;
            let diff = desiredYaw - currentYaw;
            while (diff > Math.PI) diff -= 2*Math.PI;
            while (diff < -Math.PI) diff += 2*Math.PI;
            const maxTurnSpeed = 8.0; // rad/s, ajuste
            const turn = Math.max(-maxTurnSpeed*dt, Math.min(maxTurnSpeed*dt, diff));
            playerBody.rotation.y += turn;

            walkTimer += dt * 6; // velocidad de oscilación
        } else {
            // desacelerar oscilación
            walkTimer = Math.max(0, walkTimer - dt*3);
        }

        // Aplicar oscilaciones en articulaciones (pequeñas rotaciones)
        const legAmplitude = 0.6; // rad
        const armAmplitude = 0.8;
        const swing = Math.sin(walkTimer);

        joints.leftHip.rotation.x = swing * legAmplitude;
        joints.rightHip.rotation.x = -swing * legAmplitude;
        joints.leftKnee.rotation.x = Math.max(0, -swing) * 0.8;
        joints.rightKnee.rotation.x = Math.max(0, swing) * 0.8;

        joints.leftShoulder.rotation.x = -swing * armAmplitude * 0.6;
        joints.rightShoulder.rotation.x = swing * armAmplitude * 0.6;
        joints.leftElbow.rotation.x = Math.max(0, -swing) * 0.4;
        joints.rightElbow.rotation.x = Math.max(0, swing) * 0.4;

        // Cámara tercera persona: posicionarla detrás del jugador y suavizar movimiento
        const camDistance = 5.0; // distancia atrás
        const camHeight = 3.5; // altura sobre el suelo
        const lookHeight = 1.0; // punto donde mira (sobre la posición del player)    // Dirección " atrás " basada en la rotación Y del playerBody
    const yaw = playerBody.rotation.y;
    const backDir = new BABYLON.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const desiredCamPos = playerBody.position.add(backDir.scale(camDistance)).add(new BABYLON.Vector3(0, camHeight, 0));

    // Suavizado (lerp exponencial)
    const followSpeed = 8.0;
    const t = 1 - Math.exp(-followSpeed * dt);
    camera.position = BABYLON.Vector3.Lerp(camera.position, desiredCamPos, t);

    // Apuntar al jugador (un poco por encima del centro)
    const lookAt = playerBody.position.add(new BABYLON.Vector3(0, lookHeight, 0));
    camera.setTarget(lookAt);
    });

    return { scene, playerRoot };
}

function main() {
    const { scene } = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
}

main();

export {};