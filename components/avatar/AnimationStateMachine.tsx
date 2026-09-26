"use client";

// Phase 3: the Animation State Machine. A single `moodState` drives which
// AnimationAction plays on the avatar, always fading between clips (never a
// hard cut) so state changes read as smooth transitions, not glitches.
//
// Clip mapping (placeholder rig -> TERRA state). See AvatarModel.tsx's header
// for how to export a custom model; rename these to match its own clip names
// (or rename the clips on export to match this list) when swapping models.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { MoodState } from "@/lib/types";
import { AvatarModel, type ActionName } from "./AvatarModel";

const FADE_SECONDS = 0.3;

const CLIP_FOR_STATE: Record<MoodState, ActionName> = {
  neutral: "Idle",
  energized: "Running",
  fatigued: "Sitting",
  "leveling-up": "Dance",
};

type ActionMap = Record<string, THREE.AnimationAction | null>;

export interface AnimationStateMachineProps {
  moodState: MoodState;
  facePhotoUrl?: string;
  /** Rendered once actions are ready, e.g. particle effects that key off the active clip. */
  children?: ReactNode;
}

export function AnimationStateMachine({
  moodState,
  facePhotoUrl,
  children,
}: AnimationStateMachineProps) {
  // The AnimationAction map is an imperative Three.js handle, not UI state —
  // it lives in a ref (mutating THREE objects is fine there) and `ready`
  // just triggers the effect below once it exists.
  const actionsRef = useRef<ActionMap | null>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const [ready, setReady] = useState(false);

  const handleReady = useCallback((actions: ActionMap) => {
    actionsRef.current = actions;
    setReady(true);
  }, []);

  useEffect(() => {
    const actions = actionsRef.current;
    if (!actions) return;

    const clipName = CLIP_FOR_STATE[moodState];
    const next = actions[clipName];
    if (!next || next === currentAction.current) return;

    const previous = currentAction.current;

    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.fadeIn(FADE_SECONDS);
    next.play();

    previous?.fadeOut(FADE_SECONDS);

    currentAction.current = next;

    // Non-looping "moment" clips (leveling-up's Dance) settle back to Idle
    // once played through, rather than looping the celebration forever.
    if (moodState === "leveling-up") {
      const mixer = next.getMixer();
      const handle = (event: { action: THREE.AnimationAction }) => {
        if (event.action !== next) return;
        mixer.removeEventListener("finished", handle);
        const idle = actions.Idle;
        if (idle && currentAction.current === next) {
          idle.reset().fadeIn(FADE_SECONDS).play();
          next.fadeOut(FADE_SECONDS);
          currentAction.current = idle;
        }
      };
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
      mixer.addEventListener("finished", handle);
      return () => mixer.removeEventListener("finished", handle);
    }

    next.setLoop(THREE.LoopRepeat, Infinity);
  }, [moodState, ready]);

  return (
    <>
      <AvatarModel onReady={handleReady} facePhotoUrl={facePhotoUrl} />
      {ready ? children : null}
    </>
  );
}
