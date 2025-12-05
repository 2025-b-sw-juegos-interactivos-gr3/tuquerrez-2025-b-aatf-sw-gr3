# tuquerrez-2025-b-aatf-sw-gr3
Tuquerrez Atik Amilcar Tuquerrez Flores (aatf)

Escena de prueba con Babylon.js.

Qué cambié:
- Dejé solo el suelo en la escena.
- Añadí un personaje humano simple construido con nodos articulados (joints). El personaje mueve sus articulaciones (brazos/piernas) cuando camina.
- Controles: usa las teclas W A S D para mover el personaje en el plano XZ.

Cómo ejecutar (desde la carpeta `Babylon.js`):

1. Abrir `Babylon.js/index.html` en un navegador moderno (sirve con un servidor estático o abriéndolo directamente en local si tu navegador permite módulos locales).
2. Mira el canvas y presiona W/A/S/D para mover al personaje.

Notas:
- La implementación usa `TransformNode` como articulaciones y meshes parentados a esas articulaciones.
- Si quieres reemplazar el personaje por un glTF con esqueleto, puedo integrarlo y mapear las animaciones (idle/walk) a las teclas.

Si quieres que el personaje gire hacia la dirección de movimiento o que haya colisiones físicas, dímelo y lo implemento.
