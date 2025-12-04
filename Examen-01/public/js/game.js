// ===== CONFIGURACIÓN DEL JUEGO =====
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Variables de estado del juego
let muestraEnMano = false;
let muestrasEntregadas = 0;
let inputMap = {};
let rover = null;
let muestra = null;

// Referencias a elementos UI
const statusElement = document.getElementById("status");
const scoreElement = document.getElementById("score");
const nivelElement = document.getElementById("nivel");

// Constantes de juego
const VELOCIDAD_ROVER_BASE = 0.1;
const VELOCIDAD_ROTACION = 2.5;
const ACELERACION = 0.4;
const DESACELERACION = 0.3;
const DISTANCIA_INTERACCION = 2.5;
const OFFSET_MUESTRA = new BABYLON.Vector3(3, 4, -5);

// Variables de dificultad
let velocidadRover = VELOCIDAD_ROVER_BASE;
let velocidadActual = 0;
let nivelDificultad = 1;
let muestrasParaNivel = 1;
let obstaculos = [];
let zonaRecoleccion = null;
let zonaBase = null;
let puntoRecoleccion = null;
let baseEntrega = null;

// ===== FUNCIÓN PRINCIPAL: CREAR ESCENA =====
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.clearColor = new BABYLON.Color3(0.2, 0.1, 0.08); // Cielo marciano

    console.log("🚀 Sistema inicializado");

    // ===== CÁMARA (Sistema de seguimiento tercera persona - DETRÁS DEL ROVER) =====
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, 7), scene);
    // No attachControl para control manual de la cámara
    camera.checkCollisions = false;
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));

    // ===== ILUMINACIÓN MARCIANA =====
    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    light.intensity = 0.7;
    light.diffuse = new BABYLON.Color3(1, 0.8, 0.6); // Luz anaranjada
    light.groundColor = new BABYLON.Color3(0.4, 0.2, 0.15);

    // Luz direccional (Sol marciano)
    const dirLight = new BABYLON.DirectionalLight(
        "dirLight",
        new BABYLON.Vector3(-1, -2, -1),
        scene
    );
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.6;
    dirLight.diffuse = new BABYLON.Color3(1, 0.7, 0.5);

    // ===== MATERIALES MARCIANOS =====

    // Material del rover (metálico plateado)
    const matRover = new BABYLON.StandardMaterial("matRover", scene);
    matRover.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
    matRover.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    matRover.specularPower = 64;
    matRover.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);

    // Material de la muestra de roca (rojiza marciana)
    const matMuestra = new BABYLON.StandardMaterial("matMuestra", scene);
    matMuestra.diffuseColor = new BABYLON.Color3(0.7, 0.35, 0.25);
    matMuestra.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    matMuestra.specularPower = 32;
    matMuestra.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.03);

    // Material del suelo marciano
    const matSuelo = new BABYLON.StandardMaterial("matSuelo", scene);
    matSuelo.diffuseColor = new BABYLON.Color3(0.65, 0.3, 0.2); // Rojo marciano
    matSuelo.specularColor = new BABYLON.Color3(0.15, 0.08, 0.05);
    matSuelo.ambientColor = new BABYLON.Color3(0.4, 0.2, 0.15);

    // Material zona de recolección (azul ciencia)
    const matZonaRecoleccion = new BABYLON.StandardMaterial("matZonaRecoleccion", scene);
    matZonaRecoleccion.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.9);
    matZonaRecoleccion.alpha = 0.5;
    matZonaRecoleccion.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.15);

    // Material zona base (verde tecnológico)
    const matZonaBase = new BABYLON.StandardMaterial("matZonaBase", scene);
    matZonaBase.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
    matZonaBase.alpha = 0.5;
    matZonaBase.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.08);

    // Material estructuras metálicas
    const matEstructura = new BABYLON.StandardMaterial("matEstructura", scene);
    matEstructura.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);
    matEstructura.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    matEstructura.specularPower = 64;

    // ===== SUELO MARCIANO (COMPLETAMENTE RECTO) =====
    const suelo = BABYLON.MeshBuilder.CreateGround(
        "suelo",
        { width: 30, height: 30 },
        scene
    );
    suelo.material = matSuelo;
    suelo.position.y = 0; // Asegurar que esté en Y=0

    // ===== CARGAR ROVER MECH.GLB =====
    console.log("🚗 Cargando rover Mech.glb...");
    BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "Mech.glb", scene, function (meshes, particleSystems, skeletons, animationGroups) {
        const rootMesh = meshes.find(mesh => mesh.name === "__root__") || meshes[0];

        rootMesh.computeWorldMatrix(true);
        let initialRotation = BABYLON.Vector3.Zero();
        if (rootMesh.rotationQuaternion) {
            initialRotation = rootMesh.rotationQuaternion.toEulerAngles();
            rootMesh.rotationQuaternion = null;
        } else if (rootMesh.rotation) {
            initialRotation = rootMesh.rotation.clone();
        }

        const forwardVec = BABYLON.Vector3.TransformNormal(
            BABYLON.Axis.Z,
            rootMesh.getWorldMatrix()
        ).normalize();
        const walkDirectionMultiplier = BABYLON.Vector3.Dot(forwardVec, BABYLON.Axis.Z) >= 0 ? 1 : -1;

        const initialPosition = rootMesh.position ? rootMesh.position.clone() : BABYLON.Vector3.Zero();

        const roverVisualRoot = new BABYLON.TransformNode("roverVisualRoot", scene);
        roverVisualRoot.rotationQuaternion = null;
        roverVisualRoot.position = BABYLON.Vector3.Zero();
        roverVisualRoot.rotation = initialRotation.clone();
        roverVisualRoot.rotation.y = 0;

        meshes.forEach(mesh => {
            mesh.setParent(roverVisualRoot, true);
        });

        const roverContainer = new BABYLON.TransformNode("roverPlayer", scene);
        roverContainer.rotationQuaternion = null;
        roverContainer.position = initialPosition;
        roverContainer.rotation = BABYLON.Vector3.Zero();

        roverVisualRoot.parent = roverContainer;

        rover = roverContainer;
        
        rover.scaling = new BABYLON.Vector3(0.18, 0.18, 0.18);
        rover.position.y = 0;
        rover.rotation.y = 0;
        rover.metadata = rover.metadata || {};
        rover.metadata.visualRoot = roverVisualRoot;
        rover.metadata.walkDirectionMultiplier = walkDirectionMultiplier;

        console.log("🎬 Animaciones disponibles:", animationGroups.length);
        animationGroups.forEach((anim, index) => {
            console.log(`  ${index}: ${anim.name}`);
        });

        const esNodoRaizMovimiento = (target) => {
            if (!target || !target.name) return false;
            const nombre = target.name.toLowerCase();
            return ["root", "hips", "pelvis", "armature", "base"].some(tag => nombre.includes(tag));
        };

        let walkAnim = animationGroups.find(ag =>
            ag.name.toLowerCase().includes('walk')
        );

        let danceAnim = animationGroups.find(ag =>
            ag.name.toLowerCase().includes('dance')
        );

        if (walkAnim) {
            neutralizarTraslacionRaiz(walkAnim);

            let invertirWalk = false;
            for (const ta of walkAnim.targetedAnimations) {
                const prop = (ta.targetProperty || '').toLowerCase();
                if (!esNodoRaizMovimiento(ta.target)) continue;
                const anim = ta.animation;
                if (!anim) continue;
                const keys = anim.getKeys();
                if (!keys || keys.length < 2) continue;
                let first = null, second = null;
                for (let i = 0; i < keys.length; i++) {
                    const val = keys[i].value;
                    if (val && typeof val === 'object') {
                        if (first === null) {
                            first = val;
                        } else if (second === null && (val.z !== first.z)) {
                            second = val;
                            break;
                        }
                    }
                }
                if (first && second) {
                    const deltaZ = second.z - first.z;
                    if (deltaZ > 0) invertirWalk = true;
                }
            }

            rover.walkAnimation = walkAnim;
            rover.walkAnimation.stop();
            rover.metadata.invertWalk = invertirWalk;
            console.log("Animación caminar:", walkAnim.name, "invertirWalk=", invertirWalk);
        }

        if (danceAnim) {
            neutralizarTraslacionRaiz(danceAnim);
            rover.danceAnimation = danceAnim;
            rover.danceAnimation.stop();
            const duration = (danceAnim.to - danceAnim.from) / 60;
            rover.metadata = rover.metadata || {};
            rover.metadata.danceDuration = duration || 2.0;
            console.log("✅ Animación celebración:", danceAnim.name, "Duración:", rover.metadata.danceDuration);
        }

        console.log("✅ Rover cargado exitosamente");
    });

    // ===== PUNTO DE RECOLECCIÓN =====
    puntoRecoleccion = crearPuntoRecoleccion(scene, new BABYLON.Vector3(-8, 0.15, 0), matEstructura);

    // ===== BASE DE ENTREGA =====
    baseEntrega = crearBase(scene, new BABYLON.Vector3(8, 0.15, 0), matEstructura);

    // ===== ZONAS =====
    // Zona de recolección
    zonaRecoleccion = BABYLON.MeshBuilder.CreateGround(
        "zonaRecoleccion",
        { width: 4, height: 4 },
        scene
    );
    zonaRecoleccion.position = new BABYLON.Vector3(-8, 0.31, 0);
    zonaRecoleccion.material = matZonaRecoleccion;

    // Crear muestra de roca (Cargar box.glb)
    BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "box.glb", scene, function (meshes) {
        muestra = meshes[0];
        muestra.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
        muestra.rotationQuaternion = null;
        muestra.position = new BABYLON.Vector3(
            zonaRecoleccion.position.x,
            0.6,
            zonaRecoleccion.position.z
        );
        // Aplicar color rojizo a la muestra
        if (muestra.material) {
            muestra.material = matMuestra.clone("matMuestraInstance");
        }
        console.log("✅ Muestra de roca box.glb cargada");
    });

    // Zona base
    zonaBase = BABYLON.MeshBuilder.CreateGround(
        "zonaBase",
        { width: 4, height: 4 },
        scene
    );
    zonaBase.position = new BABYLON.Vector3(8, 0.31, 0);
    zonaBase.material = matZonaBase;

    // ===== DECORACIÓN: FORMACIONES ROCOSAS =====
    const matRoca = new BABYLON.StandardMaterial("matRoca", scene);
    matRoca.diffuseColor = new BABYLON.Color3(0.5, 0.25, 0.2);
    matRoca.alpha = 0.4;

    // Formaciones rocosas en los bordes
    const formacionNorte = BABYLON.MeshBuilder.CreateBox(
        "formacionNorte",
        { width: 30, height: 3, depth: 0.5 },
        scene
    );
    formacionNorte.position = new BABYLON.Vector3(0, 1.5, 15);
    formacionNorte.material = matRoca;

    const formacionSur = BABYLON.MeshBuilder.CreateBox(
        "formacionSur",
        { width: 30, height: 3, depth: 0.5 },
        scene
    );
    formacionSur.position = new BABYLON.Vector3(0, 1.5, -15);
    formacionSur.material = matRoca;

    // ===== ELEMENTOS DECORATIVOS =====
    console.log("🪨 Creando rocas marcianas...");
    agregarRocasMarcianas(scene, matRoca);

    // ===== LÓGICA DE INPUT =====
    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyDownTrigger,
            function (evt) {
                inputMap[evt.sourceEvent.key.toLowerCase()] = true;
            }
        )
    );

    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyUpTrigger,
            function (evt) {
                inputMap[evt.sourceEvent.key.toLowerCase()] = false;
            }
        )
    );

    // ===== MECÁNICA DE RECOGER/ENTREGAR =====
    scene.onKeyboardObservable.add((kbInfo) => {
        if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
            if (kbInfo.event.key === " " || kbInfo.event.key === "e" || kbInfo.event.key === "E") {
                if (!rover || !muestra) return;

                if (!muestraEnMano) {
                    // Intentar recoger
                    let dist = BABYLON.Vector3.Distance(
                        rover.position,
                        muestra.position
                    );
                    if (dist < DISTANCIA_INTERACCION) {
                        console.log("🪨 ¡Muestra recolectada!");

                        // Guardar tamaño original si aún no está guardado
                        if (!muestra.metadata) muestra.metadata = {};
                        if (!muestra.metadata.scalingOriginal)
                            muestra.metadata.scalingOriginal = muestra.scaling.clone();

                        // ==== CAMBIAR TAMAÑO CUANDO LA RECOGE ====
                        muestra.scaling = new BABYLON.Vector3(1.8, 1.8, 1.8); // <<--- AJUSTA EL TAMAÑO AQUÍ

                        muestra.parent = rover;
                        muestra.position = OFFSET_MUESTRA.clone();
                        muestraEnMano = true;

                        actualizarUI("🚀 Llevar muestra a la Base");
                        animarRecogida(muestra);
                    }
                    else {
                        console.log("⚠️ Muy lejos de la muestra");
                    }
                } else {
                    // Intentar entregar
                    let dist = BABYLON.Vector3.Distance(
                        rover.position,
                        zonaBase.position
                    );
                    if (dist < DISTANCIA_INTERACCION) {
                        console.log("✅ ¡Muestra entregada a la base!");

                        // Animación de celebración del rover
                        if (rover && rover.danceAnimation) {
                            rover.danceAnimation.play(true);

                            const duration = (rover.metadata && rover.metadata.danceDuration) ? rover.metadata.danceDuration : 2.0;
                            const totalTime = duration * 2 * 1000;

                            setTimeout(() => {
                                rover.danceAnimation.stop();
                            }, totalTime);
                        }

                        muestra.parent = null;
                        muestra.position = zonaBase.position.clone();
                        muestra.position.y = 0.5; // Sobre el suelo recto
                        // Restaurar tamaño original al entregar
                        if (muestra.metadata && muestra.metadata.scalingOriginal) {
                            muestra.scaling = muestra.metadata.scalingOriginal.clone();
                        }
                        muestraEnMano = false;
                        muestrasEntregadas++;
                        scoreElement.textContent = muestrasEntregadas;

                        verificarSubidaNivel(scene);

                        actualizarUI(`✨ ¡Entrega ${muestrasEntregadas}! Nivel ${nivelDificultad}`);

                        animarEntrega(muestra, () => {
                            setTimeout(() => {
                                muestra.position = new BABYLON.Vector3(
                                    zonaRecoleccion.position.x,
                                    0.5, // Sobre el suelo recto
                                    zonaRecoleccion.position.z
                                );
                                // Restaurar tamaño original al reaparecer
                                if (muestra.metadata && muestra.metadata.scalingOriginal) {
                                    muestra.scaling = muestra.metadata.scalingOriginal.clone();
                                }
                                actualizarUI(`🔍 Buscar muestra de roca - Nivel ${nivelDificultad}`);
                            }, 1500);
                        });
                    } else {
                        console.log("⚠️ Muy lejos de la base");
                    }
                }
            }
        }
    });

    // ===== GAME LOOP (MOVIMIENTO) =====
    scene.onBeforeRenderObservable.add(() => {
        if (!rover) return;

        const dt = engine.getDeltaTime() / 1000;

        let forward = 0, rotation = 0;
        if (inputMap['w']) forward -= 1;
        if (inputMap['s']) forward += 1;
        if (inputMap['a']) rotation -= 1;
        if (inputMap['d']) rotation += 1;

        const posicionAnterior = rover.position.clone();

        if (forward !== 0) {
            const velocidadObjetivo = forward * velocidadRover;
            const factorAceleracion = forward * velocidadActual >= 0 ? ACELERACION : DESACELERACION * 2;
            velocidadActual += (velocidadObjetivo - velocidadActual) * factorAceleracion * dt * 60;
        } else {
            velocidadActual *= Math.pow(1 - DESACELERACION, dt * 60);
            if (Math.abs(velocidadActual) < 0.001) velocidadActual = 0;
        }

        if (rotation !== 0) {
            rover.rotation.y += rotation * VELOCIDAD_ROTACION * dt;
        }

        if (Math.abs(velocidadActual) > 0.001) {
            const yaw = rover.rotation.y;
            const forwardDir = new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
            const delta = forwardDir.scale(velocidadActual);
            rover.position.addInPlace(delta);
        }

        const moving = Math.abs(velocidadActual) > 0.01;

        // Verificar colisiones con obstáculos (cráteres)
        let hayColision = false;
        obstaculos.forEach(obs => {
            if (obs.mesh) {
                const dist = BABYLON.Vector3.Distance(
                    new BABYLON.Vector3(rover.position.x, 0, rover.position.z),
                    new BABYLON.Vector3(obs.mesh.position.x, 0, obs.mesh.position.z)
                );
                if (dist < 0.8) {
                    hayColision = true;
                }
            }
        });

        if (hayColision) {
            rover.position = posicionAnterior;
            if (!rover.metadata || !rover.metadata.colisionReciente) {
                rover.metadata = rover.metadata || {};
                rover.metadata.colisionReciente = true;

                const overlay = document.getElementById('ui-overlay');
                if (overlay) {
                    overlay.classList.add('colision-warning');
                    setTimeout(() => overlay.classList.remove('colision-warning'), 300);
                }

                setTimeout(() => {
                    if (rover.metadata) rover.metadata.colisionReciente = false;
                }, 500);
            }
        }

        if (hayColision) {
            velocidadActual = 0;
        }

        if (rover.walkAnimation) {
            if (moving && !hayColision) {
                if (!rover.walkAnimation.isPlaying) {
                    rover.walkAnimation.play(true);
                }
                const direccionMovimiento = Math.sign(velocidadActual);
                const invert = rover.metadata?.invertWalk ? -1 : 1;
                const velocidadNormalizada = Math.abs(velocidadActual) / velocidadRover;
                rover.walkAnimation.speedRatio = invert * direccionMovimiento * Math.max(0.3, velocidadNormalizada);
            } else {
                if (rover.walkAnimation.isPlaying) {
                    rover.walkAnimation.stop();
                }
            }
        }

        // Mantener rover dentro de los límites
        rover.position.x = Math.max(-14, Math.min(14, rover.position.x));
        rover.position.z = Math.max(-14, Math.min(14, rover.position.z));

        // Animación de rotación del muestra cuando está en el suelo
        if (muestra && !muestra.parent) {
            muestra.rotation.y += 0.02;
        }

        // Animación sutil de "respiración" de la muestra en mano
        if (muestra && muestraEnMano && muestra.parent === rover) {
            const time = Date.now() * 0.001;
            muestra.position.y = 0.5 + Math.sin(time * 2) * 0.05;
        }

        scene.meshes.forEach(mesh => {
            if (mesh.metadata && mesh.metadata.rotationSpeed) {
                mesh.rotation.y += mesh.metadata.rotationSpeed;
            }
        });

        if (rover.metadata && rover.metadata.visualRoot) {
            const visualRoot = rover.metadata.visualRoot;
            visualRoot.position.x = 0;
            visualRoot.position.z = 0;
        }

        // Animar obstáculos (cráteres con efecto pulsante)
        obstaculos.forEach((obs, index) => {
            const time = Date.now() * 0.002;
            const pulse = (Math.sin(time + index) + 1) * 0.5;
            if (obs.marca && obs.marca.material) {
                obs.marca.material.emissiveColor = new BABYLON.Color3(0.2 * pulse, 0.15 * pulse, 0.1 * pulse);
            }
        });

        // ===== SISTEMA DE CÁMARA DE SEGUIMIENTO (detrás del rover) =====
        const camDistance = -7.0; // distancia detrás del rover
        const camHeight = 5; // altura sobre el suelo
        const lookHeight = 1.0; // punto donde mira en el rover

        // Dirección "atrás" basada en la rotación Y del rover
        const yaw = rover.rotation.y;
        const backDir = new BABYLON.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const desiredCamPos = rover.position.add(backDir.scale(camDistance)).add(new BABYLON.Vector3(0, camHeight, 0));

        // Suavizado (lerp exponencial)
        const followSpeed = 8.0;
        const t = 1 - Math.exp(-followSpeed * dt);
        camera.position = BABYLON.Vector3.Lerp(camera.position, desiredCamPos, t);

        // Apuntar al rover (un poco por encima del centro)
        const lookAt = rover.position.add(new BABYLON.Vector3(0, lookHeight, 0));
        camera.setTarget(lookAt);
    });

    console.log("✅ Escena de Marte creada exitosamente");
    return scene;
};

// ===== UTILIDADES DE ANIMACIÓN =====
const ROOT_NODE_KEYWORDS = ["root", "hips", "pelvis", "armature", "base"];

function esNodoRaizMovimiento(target) {
    if (!target || !target.name) return false;
    const lowerName = target.name.toLowerCase();
    return ROOT_NODE_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function neutralizarTraslacionRaiz(animGroup) {
    if (!animGroup) return;
    animGroup.targetedAnimations.forEach(targetAnim => {
        if (!esNodoRaizMovimiento(targetAnim.target)) {
            return;
        }

        const anim = targetAnim.animation;
        if (!anim) return;

        const property = (targetAnim.targetProperty || "").toLowerCase();
        if (
            property === "position" &&
            anim.dataType === BABYLON.Animation.ANIMATIONTYPE_VECTOR3
        ) {
            const sanitizedKeys = anim.getKeys().map(key => {
                const valor = key.value;
                const y = valor && typeof valor === "object" && "y" in valor ? valor.y : 0;
                return {
                    frame: key.frame,
                    value: new BABYLON.Vector3(0, y, 0)
                };
            });
            anim.setKeys(sanitizedKeys);
        } else if (property === "position.x" || property === "position.z") {
            const sanitizedKeys = anim.getKeys().map(key => ({
                frame: key.frame,
                value: 0
            }));
            anim.setKeys(sanitizedKeys);
        }
    });
}

// ===== FUNCIÓN: CREAR PUNTO DE RECOLECCIÓN =====
function crearPuntoRecoleccion(scene, posicion, material) {
    const contenedor = new BABYLON.TransformNode("puntoRecoleccionContainer");
    contenedor.position = posicion;

    // Plataforma principal
    const plataforma = BABYLON.MeshBuilder.CreateCylinder(
        "plataformaRecoleccion",
        { height: 0.3, diameter: 5 },
        scene
    );
    plataforma.material = material;
    plataforma.parent = contenedor;

    // Postes de marcación
    for (let i = 0; i < 4; i++) {
        const angulo = (i * Math.PI * 2) / 4;
        const x = Math.cos(angulo) * 2;
        const z = Math.sin(angulo) * 2;

        const poste = BABYLON.MeshBuilder.CreateCylinder(
            `posteRecoleccion${i}`,
            { height: 1.5, diameter: 0.15 },
            scene
        );
        poste.material = material;
        poste.parent = contenedor;
        poste.position = new BABYLON.Vector3(x, 0.75, z);

        // Luz en la parte superior
        const luz = BABYLON.MeshBuilder.CreateSphere(
            `luzPoste${i}`,
            { diameter: 0.3 },
            scene
        );
        const matLuz = new BABYLON.StandardMaterial(`matLuz${i}`, scene);
        matLuz.emissiveColor = new BABYLON.Color3(0.3, 0.6, 0.9);
        luz.material = matLuz;
        luz.parent = contenedor;
        luz.position = new BABYLON.Vector3(x, 1.5, z);
    }

    return contenedor;
}

// ===== FUNCIÓN: CREAR BASE =====
function crearBase(scene, posicion, material) {
    const contenedor = new BABYLON.TransformNode("baseContainer");
    contenedor.position = posicion;

    // Estructura principal
    const estructura = BABYLON.MeshBuilder.CreateBox(
        "estructuraBase",
        { width: 4, height: 2, depth: 4 },
        scene
    );
    estructura.material = material;
    estructura.parent = contenedor;
    estructura.position.y = 1;

    // Cúpula superior
    const cupula = BABYLON.MeshBuilder.CreateSphere(
        "cupulaBase",
        { diameter: 3, segments: 16, slice: 0.5 },
        scene
    );
    const matCupula = new BABYLON.StandardMaterial("matCupula", scene);
    matCupula.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.4);
    matCupula.alpha = 0.6;
    matCupula.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.15);
    cupula.material = matCupula;
    cupula.parent = contenedor;
    cupula.position.y = 2.5;

    // Antena
    const antena = BABYLON.MeshBuilder.CreateCylinder(
        "antenaBase",
        { height: 1.5, diameter: 0.1 },
        scene
    );
    antena.material = material;
    antena.parent = contenedor;
    antena.position.y = 3.5;

    // Luz superior antena
    const luzAntena = BABYLON.MeshBuilder.CreateSphere(
        "luzAntena",
        { diameter: 0.3 },
        scene
    );
    const matLuzAntena = new BABYLON.StandardMaterial("matLuzAntena", scene);
    matLuzAntena.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.3);
    luzAntena.material = matLuzAntena;
    luzAntena.parent = contenedor;
    luzAntena.position.y = 4.3;
    luzAntena.metadata = { rotationSpeed: 0.02 };

    return contenedor;
}

// ===== FUNCIÓN: VERIFICAR SUBIDA DE NIVEL =====
function verificarSubidaNivel(scene) {
    if (muestrasEntregadas % muestrasParaNivel === 0) {
        nivelDificultad++;

        velocidadRover = VELOCIDAD_ROVER_BASE;

        console.log(`🎯 ¡NIVEL ${nivelDificultad}!`);
        console.log(`⚡ Velocidad: ${velocidadRover.toFixed(3)}`);

        if (nivelDificultad > 1) {
            cambiarUbicacionZonas(scene);
        }

        const numObstaculos = nivelDificultad === 2 ? 2 : (nivelDificultad > 2 ? 3 : 0);
        for (let i = 0; i < numObstaculos; i++) {
            setTimeout(() => crearCrater(scene), i * 200);
        }

        statusElement.style.color = "#00ff88";
        statusElement.style.fontSize = "18px";
        actualizarUI(`🎯 ¡NIVEL ${nivelDificultad}! ¡Más difícil!`);

        setTimeout(() => {
            statusElement.style.color = "#ffcc00";
            statusElement.style.fontSize = "14px";
        }, 2000);

        if (nivelElement) {
            nivelElement.textContent = nivelDificultad;
            nivelElement.style.color = "#00ff88";
            nivelElement.style.fontSize = "18px";
            setTimeout(() => {
                nivelElement.style.color = "#00ff88";
                nivelElement.style.fontSize = "16px";
            }, 2000);
        }
    }
}

// ===== FUNCIÓN: CAMBIAR UBICACIÓN DE ZONAS =====
function cambiarUbicacionZonas(scene) {
    if (!zonaRecoleccion || !zonaBase || !puntoRecoleccion || !baseEntrega) return;

    const posicionesDisponibles = [
        { x: -10, z: -8 },
        { x: -10, z: 8 },
        { x: 10, z: -8 },
        { x: 10, z: 8 },
        { x: -12, z: 0 },
        { x: 12, z: 0 },
        { x: 0, z: -10 },
        { x: 0, z: 10 }
    ];

    const indices = [];
    while (indices.length < 2) {
        const idx = Math.floor(Math.random() * posicionesDisponibles.length);
        if (!indices.includes(idx)) {
            indices.push(idx);
        }
    }

    const nuevaPosRecoleccion = posicionesDisponibles[indices[0]];
    const nuevaPosBase = posicionesDisponibles[indices[1]];

    animarMovimientoZona(zonaRecoleccion, puntoRecoleccion, nuevaPosRecoleccion);
    animarMovimientoZona(zonaBase, baseEntrega, nuevaPosBase);

    if (muestra && muestra.parent === null) {
        muestra.position = new BABYLON.Vector3(nuevaPosRecoleccion.x, 0.5, nuevaPosRecoleccion.z);
    }

    console.log(`📍 Zonas reubicadas: Recolección(${nuevaPosRecoleccion.x}, ${nuevaPosRecoleccion.z}), Base(${nuevaPosBase.x}, ${nuevaPosBase.z})`);
}

// ===== FUNCIÓN: ANIMAR MOVIMIENTO DE ZONA =====
function animarMovimientoZona(zona, estructura, nuevaPos) {
    const duration = 1000;
    const startTime = Date.now();
    const startPosZona = zona.position.clone();
    const startPosEstructura = estructura.position.clone();
    const targetPosZona = new BABYLON.Vector3(nuevaPos.x, 0.31, nuevaPos.z);
    const targetPosEstructura = new BABYLON.Vector3(nuevaPos.x, 0.15, nuevaPos.z);

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        zona.position = BABYLON.Vector3.Lerp(startPosZona, targetPosZona, easeProgress);
        estructura.position = BABYLON.Vector3.Lerp(startPosEstructura, targetPosEstructura, easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// ===== FUNCIÓN: CREAR CRÁTER (OBSTÁCULO) =====
function crearCrater(scene) {
    const matCrater = new BABYLON.StandardMaterial(`matCrater${obstaculos.length}`, scene);
    matCrater.diffuseColor = new BABYLON.Color3(0.5, 0.25, 0.2);
    matCrater.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.03);

    let x, z;
    let intentos = 0;
    let posicionValida = false;

    while (!posicionValida && intentos < 20) {
        x = Math.random() * 16 - 8;
        z = Math.random() * 16 - 8;

        posicionValida = true;

        for (let obs of obstaculos) {
            if (obs.mesh) {
                const dist = Math.sqrt(
                    Math.pow(x - obs.mesh.position.x, 2) +
                    Math.pow(z - obs.mesh.position.z, 2)
                );
                if (dist < 2.5) {
                    posicionValida = false;
                    break;
                }
            }
        }
        intentos++;
    }

    // Cráter principal (cilindro invertido)
    const crater = BABYLON.MeshBuilder.CreateCylinder(
        `crater${obstaculos.length}`,
        { height: 0.5, diameterTop: 1.5, diameterBottom: 1.0 },
        scene
    );
    crater.position = new BABYLON.Vector3(x, 0.25, z);
    crater.material = matCrater;

    // Borde del cráter (torus)
    const borde = BABYLON.MeshBuilder.CreateTorus(
        `bordeCrater${obstaculos.length}`,
        { diameter: 1.5, thickness: 0.15, tessellation: 16 },
        scene
    );
    const matBorde = new BABYLON.StandardMaterial(`matBorde${obstaculos.length}`, scene);
    matBorde.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.25);
    matBorde.emissiveColor = new BABYLON.Color3(0.15, 0.08, 0.05);
    borde.material = matBorde;
    borde.position = new BABYLON.Vector3(x, 0.5, z);
    borde.rotation.x = Math.PI / 2;

    // Efecto de aparición
    crater.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    borde.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);

    const startTime = Date.now();
    const animarAparicion = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);
        const scale = progress;

        crater.scaling = new BABYLON.Vector3(scale, scale, scale);
        borde.scaling = new BABYLON.Vector3(scale, scale, scale);

        if (progress < 1) {
            requestAnimationFrame(animarAparicion);
        }
    };
    animarAparicion();

    obstaculos.push({ mesh: crater, marca: borde });

    console.log(`🕳️ Nuevo cráter ${obstaculos.length} en (${x.toFixed(1)}, ${z.toFixed(1)})`);
}

// ===== FUNCIÓN: AGREGAR ROCAS MARCIANAS =====
function agregarRocasMarcianas(scene, material) {
    const matRoca = new BABYLON.StandardMaterial("matRocaMarciana", scene);
    matRoca.diffuseColor = new BABYLON.Color3(0.55, 0.3, 0.25);
    matRoca.specularColor = new BABYLON.Color3(0.2, 0.1, 0.08);

    const matDestacado = new BABYLON.StandardMaterial("matDestacado", scene);
    matDestacado.diffuseColor = new BABYLON.Color3(0.7, 0.4, 0.3);
    matDestacado.emissiveColor = new BABYLON.Color3(0.15, 0.08, 0.05);

    const posiciones = [
        { x: -12, z: -12 },
        { x: -12, z: 12 },
        { x: 12, z: -12 },
        { x: 12, z: 12 }
    ];

    posiciones.forEach((pos, index) => {
        const altura = 1.2 + Math.random() * 0.8;

        // Roca principal (forma irregular)
        const roca = BABYLON.MeshBuilder.CreateSphere(
            `roca${index}`,
            { diameter: altura * 1.5, segments: 8 },
            scene
        );
        roca.position = new BABYLON.Vector3(pos.x, altura / 2, pos.z);
        roca.scaling = new BABYLON.Vector3(1, 0.7, 1.2); // Forma irregular
        roca.material = matRoca;

        // Marca geológica
        const marca = BABYLON.MeshBuilder.CreateCylinder(
            `marca${index}`,
            { height: 0.1, diameter: altura * 1.2 },
            scene
        );
        marca.position = new BABYLON.Vector3(pos.x, altura * 0.5, pos.z);
        marca.material = matDestacado;

        // Rocas pequeñas alrededor
        for (let i = 0; i < 3; i++) {
            const angulo = (i * Math.PI * 2) / 3;
            const distancia = altura * 0.8;
            const rocaPeq = BABYLON.MeshBuilder.CreateSphere(
                `rocaPeq${index}_${i}`,
                { diameter: 0.3 + Math.random() * 0.3, segments: 6 },
                scene
            );
            rocaPeq.position = new BABYLON.Vector3(
                pos.x + Math.cos(angulo) * distancia,
                0.15,
                pos.z + Math.sin(angulo) * distancia
            );
            rocaPeq.material = matRoca;
        }
    });
}

// ===== FUNCIÓN: ACTUALIZAR UI =====
function actualizarUI(mensaje) {
    statusElement.textContent = mensaje;
}

// ===== FUNCIÓN: ANIMAR RECOGIDA =====
function animarRecogida(mesh) {
    const startY = mesh.position.y;
    const targetY = OFFSET_MUESTRA.y;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);

        if (mesh.parent) {
            mesh.position.y = startY + (targetY - startY) * easeProgress;
            mesh.rotation.y += 0.1;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
    };

    animate();
}

// ===== FUNCIÓN: ANIMAR ENTREGA =====
function animarEntrega(mesh, callback) {
    const duration = 500;
    const startTime = Date.now();
    const startScale = mesh.scaling.clone();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
        mesh.scaling = new BABYLON.Vector3(
            startScale.x * scale,
            startScale.y * scale,
            startScale.z * scale
        );

        mesh.rotation.y += 0.15;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            mesh.scaling = startScale;
            if (callback) callback();
        }
    };

    animate();
}

// ===== INICIAR JUEGO =====
const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});

console.log("🚀 Explorador de Marte iniciado");
console.log("🪨 Recolecta muestras de rocas y llévalas a la base");