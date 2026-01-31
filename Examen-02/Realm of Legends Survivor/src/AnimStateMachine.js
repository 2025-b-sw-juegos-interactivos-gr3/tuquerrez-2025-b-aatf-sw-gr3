/**
 * AnimStateMachine – drives bipedal animation per character instance.
 *
 * STATES:
 *   IDLE    → breathing/standing loop (plays when player is not moving)
 *   RUN     → walk/run cycle loop     (plays when character moves)
 *   DEAD    → death/fall, plays once  (terminal state)
 *
 * CLIP NAME MATCHING:
 *   glTF exporters name clips differently ("Armature|Run", "run_cycle", "Run", etc.).
 *   We match by searching for substrings (case-insensitive) so it works with any
 *   standard humanoid .glb without the user having to rename anything.
 *
 * USAGE:
 *   const anim = new AnimStateMachine(animationGroups);
 *   anim.setState("RUN");
 *   anim.setState("IDLE");
 *   anim.setState("DEAD");   // terminal
 */
export class AnimStateMachine {
  constructor(animationGroups) {
    this.state = null;

    // ─── Resolver clips por nombre fuzzy ───
    this.clips = {
      IDLE: this._findClip(animationGroups, ["idle", "stand", "breath"]),
      RUN:  this._findClip(animationGroups, ["run", "walk", "move", "locomot"]),
      DEAD: this._findClip(animationGroups, ["death", "die", "dead", "fall", "down"])
    };

    // Fallback: si no encontramos RUN, buscar walk explícitamente
    if (!this.clips.RUN) {
      this.clips.RUN = this._findClip(animationGroups, ["walk"]);
    }

    // Detener todas las animaciones inicialmente
    animationGroups.forEach(g => g.stop());

    // Empezar en IDLE (o RUN si no hay IDLE)
    if (this.clips.IDLE) {
      this.clips.IDLE.start(true);
      this.state = "IDLE";
    } else if (this.clips.RUN) {
      this.clips.RUN.start(true);
      this.state = "RUN";
    }
  }

  /** Busca el primer AnimationGroup cuyo nombre contenga alguna keyword. */
  _findClip(groups, keywords) {
    for (const group of groups) {
      const nameLower = group.name.toLowerCase();
      for (const kw of keywords) {
        if (nameLower.includes(kw)) return group;
      }
    }
    return null;
  }

  /**
   * Transiciona al estado dado.
   * No hace nada si ya estamos en ese estado o si el estado actual es DEAD (terminal).
   */
  setState(newState) {
    if (newState === this.state) return;
    if (this.state === "DEAD") return;

    // Detener clip actual
    const current = this.clips[this.state];
    if (current) current.stop();

    this.state = newState;
    const target = this.clips[newState];
    if (!target) return; // clip no disponible, no crashear

    if (newState === "DEAD") {
      target.start(false); // play once
    } else {
      target.start(true);  // loop
    }
  }

  /** Detiene todo (usar al devolver enemigo al pool). */
  stopAll() {
    for (const key of ["IDLE", "RUN", "DEAD"]) {
      if (this.clips[key]) this.clips[key].stop();
    }
    this.state = null;
  }

  /** Reset al estado inicial (usar al reactivar enemigo desde el pool). */
  resetToIdle() {
    this.stopAll();
    if (this.clips.IDLE) {
      this.clips.IDLE.start(true);
      this.state = "IDLE";
    } else if (this.clips.RUN) {
      this.clips.RUN.start(true);
      this.state = "RUN";
    }
  }
}