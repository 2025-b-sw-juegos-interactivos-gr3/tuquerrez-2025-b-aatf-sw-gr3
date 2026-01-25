# The Vanishing - Vertical Slice

**Examen Final - Implementación de Prototipo Jugable**

Vertical Slice del RPG en primera persona "The Vanishing", desarrollado como prueba de concepto técnica para el curso de Diseño de Videojuegos.

---

## 📖 Descripción

Este proyecto implementa la **escena inicial del juego** donde el protagonista despierta en casa de Harold y Anna Greenfield después de ser rescatado del naufragio. 

### 🎯 Mecánicas Core Implementadas

1. **Sistema de Diálogo con Opciones Múltiples**
   - Ramificación narrativa basada en decisiones del jugador
   - 15+ nodos de diálogo interconectados
   - Implementado como State Machine

2. **Sistema de Relaciones**
   - Las decisiones afectan la relación con NPCs
   - Feedback visual inmediato (cambio de color de NPCs)
   - 3 estados: HOSTILE (-10 o menos) | NEUTRAL (-10 a 20) | FRIENDLY (20+)

3. **Controles FPS**
   - Movimiento WASD
   - Cámara con mouse
   - Colisiones con el entorno

4. **Sistema de Interacción**
   - Detección de objetos interactuables mediante Raycast
   - Prompts contextuales en UI

---

## 🛠️ Tecnologías Utilizadas

- **Motor:** Babylon.js 6.40.0
- **Bundler:** Parcel 2.11.0
- **Lenguaje:** JavaScript ES6+
- **Estilo:** CSS3

---

## 📦 Instalación y Ejecución

### Requisitos Previos
- Node.js 16+ ([Descargar aquí](https://nodejs.org/))
- NPM (incluido con Node.js)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm start
```

El juego se abrirá automáticamente en tu navegador en `http://localhost:1234`

### Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| **W, A, S, D** | Movimiento del personaje |
| **Mouse** | Mirar alrededor (cámara FPS) |
| **E** | Interactuar con NPCs |
| **1-9** | Seleccionar opción de diálogo rápidamente |
| **ESC** | Cerrar diálogo activo |

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── systems/
│   ├── DialogueSystem.js      # State Machine para diálogos
│   ├── RelationshipSystem.js  # Gestión de relaciones con NPCs
│   └── InteractionSystem.js   # Detección por Raycast
├── data/
│   └── dialogues.js            # Base de datos de diálogos (JSON-like)
├── utils/
│   └── SceneBuilder.js         # Constructor de la escena 3D (Greybox)
└── main.js                     # Punto de entrada principal
```

### Patrones de Diseño Implementados

1. **State Machine** (DialogueSystem)
   - Cada nodo de diálogo es un estado
   - Las opciones del jugador son transiciones entre estados

2. **Observer Pattern** (RelationshipSystem)
   - Los NPCs "observan" cambios en el valor de relación
   - Actualizan su color automáticamente

3. **Factory Pattern** (SceneBuilder)
   - Métodos especializados para crear diferentes objetos 3D
   - Encapsula la complejidad de construcción de la escena

4. **Interface Pattern** (Metadata de Interacción)
   - Objetos con `metadata.canInteract = true` implementan la "interfaz" de interactuables

---

## 📊 Conexión con el GDD

### Secciones del GDD Implementadas:

| Sección GDD | Estado | Notas |
|-------------|--------|-------|
| **5.1.1 Dialogue System** | ✅ Completo | Sistema con 15+ nodos ramificados |
| **5.1.3 Relationship System** | ✅ Completo | Feedback visual implementado |
| **4.1.2 Storyboard - Panel 2** | ✅ Completo | Escena del despertar |
| **4.2.1 Chapter 1: The Great Storm** | ✅ Completo | Diálogos basados en la narrativa |
| **6.1 Character Mechanics** | ⚠️ Parcial | Solo FPS, sin combate |

---

## 🎬 Análisis MDA (Mecánica-Dinámica-Estética)

### MECÁNICA
- Seleccionar opciones de diálogo mediante clicks o teclas numéricas
- Cada opción tiene un valor de `relationshipChange` asociado

### DINÁMICA
- Las decisiones del jugador acumulan puntos de relación
- Al alcanzar umbrales (-10, 20), el estado cambia
- Los NPCs reaccionan visualmente (cambio de color)

### ESTÉTICA
- **Sensación de "Agency"**: El jugador siente que sus palabras tienen peso
- **Feedback inmediato**: Ver a los NPCs cambiar de color refuerza la consecuencia
- **Tensión narrativa**: Elegir entre ser cortés vs urgente crea dilemas morales

---

## 🐛 Debugging

El proyecto incluye funciones de debug accesibles desde la consola del navegador:

```javascript
// Resetear relación a 0
DEBUG.resetRelationship();

// Añadir/restar puntos manualmente
DEBUG.addRelationship(50);  // +50 puntos
DEBUG.addRelationship(-30); // -30 puntos

// Ver puntos actuales
DEBUG.getRelationship();

// Saltar a un nodo de diálogo específico
DEBUG.startDialogue('accept_quest');
```

---

## 📝 Desafíos Técnicos Resueltos

### Problema 1: Integración de Controles FPS con UI de Diálogo
**Solución:** Al iniciar un diálogo, se ejecuta `camera.detachControl()` para evitar que el mouse mueva la cámara mientras el jugador hace click en opciones. Al cerrar el diálogo, se restaura con `camera.attachControl()`.

**Código relevante:**
```javascript
// InteractionSystem.js, línea 87
startDialogue() {
    this.camera.detachControl();
    this.dialogueSystem.startDialogue(dialogueNode);
}
```

### Problema 2: Actualización Suave de Colores de NPCs
**Solución:** En lugar de cambiar el color instantáneamente, se usa interpolación lineal (lerp) en cada frame del render loop para una transición suave.

**Código relevante:**
```javascript
// RelationshipSystem.js, línea 102
updateNPCColors() {
    const lerpFactor = 0.1;
    current.r += (targetColor.r - current.r) * lerpFactor;
    // ... (mismo para G y B)
}
```

### Problema 3: Detección Precisa de Interacción
**Solución:** Uso de `camera.getForwardRay(distance)` para lanzar un rayo desde la cámara. Solo los objetos con `metadata.canInteract === true` activan el prompt.

**Código relevante:**
```javascript
// InteractionSystem.js, línea 47
const ray = this.camera.getForwardRay(this.interactionRange);
const hit = this.scene.pickWithRay(ray);
if (hit.hit && this.isInteractable(hit.pickedMesh)) { ... }
```

---

## 🎥 Guía para el Video de Presentación

### Estructura Sugerida (3-5 minutos)

**[0:00 - 0:45] Demostración**
1. Mostrar el juego corriendo
2. Caminar hacia Harold con WASD
3. Presionar E para hablar
4. Seleccionar una opción agresiva → mostrar barra roja
5. Reiniciar y seleccionar opciones amistosas → barra verde

**[0:45 - 1:15] Conexión con GDD**
```
"Como se define en nuestro GDD de The Vanishing, la mecánica
core es el sistema de diálogo que afecta las relaciones. 
Esto se ve implementado aquí en la escena inicial del Capítulo 1."
```

**[1:15 - 2:45] Code Review**
- Abrir `DialogueSystem.js` → explicar State Machine
- Abrir `RelationshipSystem.js` → explicar cómo funciona el lerp de colores
- Abrir `InteractionSystem.js` → explicar el raycast

**[2:45 - 3:30] Análisis MDA**
```
MECÁNICA: Seleccionar opciones
DINÁMICA: Las decisiones acumulan puntos
ESTÉTICA: Sensación de "Agency" y consecuencias inmediatas
```

**[3:30 - 4:00] Reflexión**
```
"Lo que funcionó: La narrativa del GDD fue perfecta para implementar.
Lo que cambié: Simplifiqué el sistema de relaciones a 3 estados
en lugar de un sistema granular para el alcance del slice."
```

---

## ✅ Checklist de Entrega

- [x] Repositorio público en GitHub
- [x] `.gitignore` para Node.js
- [x] `README.md` con instrucciones claras
- [x] Código comentado y organizado
- [x] Sistema de diálogo funcional
- [x] Sistema de relaciones con feedback visual
- [x] Controles FPS implementados
- [x] Proyecto descarga y corre sin errores

---

## 🎓 Créditos

- **Motor:** Babylon.js ([https://babylonjs.com](https://babylonjs.com))
- **Narrativa:** Basada en "The Vanishing" GDD
- **Desarrollo:** [Atik T]
- **Curso:** Diseño de Videojuegos - Examen Final

---

## 📜 Licencia

Este proyecto es un trabajo académico desarrollado para fines educativos.

MIT License - Ver archivo `LICENSE` para más detalles.

---

## 📧 Contacto

Para preguntas o comentarios sobre este proyecto:
- **GitHub:** [AtikTF](https://github.com/AtikTF)
- **Email:** atiktuquerres@gmail.com

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026