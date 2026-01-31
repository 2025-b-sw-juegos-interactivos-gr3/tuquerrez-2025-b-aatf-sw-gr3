import { SceneLoader, TransformNode } from "@babylonjs/core";

/**
 * ModelCache – Singleton async loader (loads once, clones many).
 *
 * WHY THIS EXISTS:
 *   SceneLoader.ImportMeshAsync is async (network I/O).
 *   But Player + EnemyPool (80 enemies) need meshes at construction time.
 *   Solution: load each .glb exactly ONCE here, cache the result,
 *   then every Player/Enemy calls cloneModel() which is fully synchronous
 *   and very cheap (no network, no parsing — just cloning geometry).
 *
 * USAGE:
 *   await ModelCache.getInstance().init(scene);
 *   const clone = ModelCache.getInstance().cloneModel("player", scene, "player_0");
 *     → { root, meshes, animationGroups, skeleton }
 */
export class ModelCache {
  static _instance = null;

  static getInstance() {
    if (!ModelCache._instance) {
      ModelCache._instance = new ModelCache();
    }
    return ModelCache._instance;
  }

  constructor() {
    this._cache = {};
    this._scene = null;
  }

  // ─── Carga inicial (una sola vez, en main.js antes de GameManager) ───
  async init(scene) {
    this._scene = scene;
    await this._load(scene, "player", "/assets/models/player.glb");
    await this._load(scene, "enemy", "/assets/models/enemy.glb");
  }

  async _load(scene, key, url) {
    const lastSlash = url.lastIndexOf("/");
    const rootUrl = url.substring(0, lastSlash + 1);
    const filename = url.substring(lastSlash + 1);

    const result = await SceneLoader.ImportMeshAsync(
      "",
      rootUrl,
      filename,
      scene
    );

    result.meshes.forEach(m => m.setEnabled(false));

    this._cache[key] = {
      meshes: result.meshes,
      skeletons: result.skeletons,
      animationGroups: result.animationGroups
    };
  }


  /**
   * Clona sincrónicamente un modelo cacheado.
   *
   * @param {string} key        - "player" o "enemy"
   * @param {string} uniqueName - prefijo único por instancia
   * @param {number} scale      - escala uniforme del modelo (default 1)
   *
   * Retorna:
   *   root            → TransformNode pivot (movemos/rotamos/escalamos este nodo)
   *   meshes          → todos los Mesh hijos (para setEnabled / emissive flash)
   *   animationGroups → AnimationGroups clonadas, re-mapeadas al skeleton clonado
   *   skeleton        → skeleton clonado
   */
  cloneModel(key, uniqueName, scale = 1) {
    const cached = this._cache[key];
    if (!cached) {
      console.error(`ModelCache: modelo "${key}" no cargado.`);
      return null;
    }

    // ─── Crear pivot TransformNode ───
    // Este nodo es el "contenedor" del modelo. Toda la posición, rotación y escala
    // del personaje se aplica aquí. Los meshes son hijos de este nodo.
    const pivot = new TransformNode(uniqueName + "_pivot", this._scene);
    pivot.scaling.set(scale, scale, scale);

    // ─── Clonar skeleton ───
    let clonedSkeleton = null;
    if (cached.skeletons && cached.skeletons.length > 0) {
      clonedSkeleton = cached.skeletons[0].clone(uniqueName + "_skel");
    }

    // ─── Clonar meshes y hacerlos hijos del pivot ───
    const clonedMeshes = [];
    cached.meshes.forEach((m, i) => {
      const clone = m.clone(uniqueName + "_mesh_" + i);
      clone.setEnabled(true);

      // Enlazar al skeleton clonado
      if (clonedSkeleton && m.skeleton) {
        clone.skeleton = clonedSkeleton;
      }

      // Hacer hijo del pivot → hereda posición, rotación y escala del pivot
      clone.parent = pivot;

      clonedMeshes.push(clone);
    });

    // ─── Forzar cálculo de matrices ───
    pivot.computeWorldMatrix(true);

    // 1. Obtenemos los límites reales
    const bounds = pivot.getHierarchyBoundingVectors(true);
    
    // 2. Calculamos cuánto hay que subir los hijos para que el mínimo sea 0
    // Usamos el valor absoluto o simplemente restamos el min.y a la posición de cada hijo
    const offsetY = -bounds.min.y;

    clonedMeshes.forEach(mesh => {
        // Solo ajustamos los meshes que no tienen padre (o cuyo padre es el pivot)
        // para no mover dos veces los sub-meshes.
        if (mesh.parent === pivot) {
            mesh.position.y += offsetY;
        }
    });

    // 3. (Opcional) Si el esqueleto no sigue a los meshes automáticamente, 
    // a veces es necesario resetear la matriz del pivot
    pivot.computeWorldMatrix(true);



    // ─── Clonar AnimationGroups y re-mapear targets ───
    const clonedAnimGroups = [];
    cached.animationGroups.forEach((origGroup) => {
      const cloned = origGroup.clone(uniqueName + "_anim_" + origGroup.name);

      if (clonedSkeleton && cached.skeletons[0]) {
        cloned.animationTargets = cloned.animationTargets.map(t =>
          t === cached.skeletons[0] ? clonedSkeleton : t
        );
      }

      clonedAnimGroups.push(cloned);
    });

    return {
      root: pivot,            // ← movemos/rotamos/escalamos este nodo
      meshes: clonedMeshes,     // ← para setEnabled / emissive
      animationGroups: clonedAnimGroups,
      skeleton: clonedSkeleton
    };
  }
}