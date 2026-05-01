"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Skip physics (e.g. reduced motion). */
  disabled?: boolean;
  /** Target becomes rest — use while card is flipped. */
  freeze?: boolean;
  className?: string;
  /**
   * `"spring"` — mass–spring hinge tilt (option 1).
   * `"direct"` — high-gain mapped tilt (option 2).
   * `"extrude"` — same spring tilt + spring **translateZ** so the card floats toward you (3D “out of the page”).
   */
  mode?: TeamCardPhysicsMode;
};

/** Toggle leadership-card motion here (and `landing-page` passes this through). */
export type TeamCardPhysicsMode = "spring" | "direct" | "extrude";

/** Default: try `"extrude"` for obvious 3D; use `"spring"` or `"direct"` to compare. */
export const TEAM_CARD_PHYSICS_MODE: TeamCardPhysicsMode = "extrude";

/* ── Spring tilt (options 1 & 3) ── */
const SPRING_MAX_RX = 14;
const SPRING_MAX_RY = 17;
const SPRING_STIFFNESS = 46;
const SPRING_DAMPING = 12;

/* ── Spring Z pop (option 3 only) — px toward camera while pointer is inside ── */
const EXTRUDE_Z_TARGET = 40;
const SPRING_Z_STIFFNESS = 58;
const SPRING_Z_DAMPING = 15;

/* ── Direct tilt (option 2) ── */
const DIRECT_MAX_RX = 20;
const DIRECT_MAX_RY = 26;

export function TeamCardPhysicsShell({ children, disabled, freeze, className, mode = TEAM_CARD_PHYSICS_MODE }: Props) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }
  if (mode === "direct") {
    return (
      <TeamCardPhysicsDirect freeze={freeze} className={className}>
        {children}
      </TeamCardPhysicsDirect>
    );
  }
  const extrudeZ = mode === "extrude" ? EXTRUDE_Z_TARGET : 0;
  return (
    <TeamCardPhysicsSpring extrudeZPx={extrudeZ} freeze={freeze} className={className}>
      {children}
    </TeamCardPhysicsSpring>
  );
}

type SpringProps = Omit<Props, "disabled" | "mode"> & { extrudeZPx: number };

function TeamCardPhysicsSpring({ children, freeze, className, extrudeZPx }: SpringProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: 0, ry: 0 });
  const pos = useRef({ rx: 0, ry: 0 });
  const vel = useRef({ rx: 0, ry: 0 });
  const posZ = useRef(0);
  const velZ = useRef(0);
  const hover = useRef(false);
  const freezeRef = useRef(freeze);
  const extrudeRef = useRef(extrudeZPx);
  const rafId = useRef<number | null>(null);
  const lastTick = useRef(0);

  freezeRef.current = freeze;
  extrudeRef.current = extrudeZPx;

  const tick = useCallback((time: number) => {
    const root = rootRef.current;
    if (!root) {
      rafId.current = null;
      return;
    }

    if (!lastTick.current) {
      lastTick.current = time;
      rafId.current = requestAnimationFrame(tick);
      return;
    }

    const dt = Math.min(0.045, Math.max(0.008, (time - lastTick.current) / 1000));
    lastTick.current = time;

    const tr = freezeRef.current ? { rx: 0, ry: 0 } : target.current;
    const extrude = extrudeRef.current > 0;

    for (const axis of ["rx", "ry"] as const) {
      const p = pos.current[axis];
      const v = vel.current[axis];
      const tg = tr[axis];
      const accel = SPRING_STIFFNESS * (tg - p) - SPRING_DAMPING * v;
      vel.current[axis] += accel * dt;
      pos.current[axis] += vel.current[axis] * dt;
    }

    let zTransform = "";
    if (extrude) {
      const zGoal = !hover.current || freezeRef.current ? 0 : extrudeRef.current;
      const pz = posZ.current;
      const vz = velZ.current;
      const accelZ = SPRING_Z_STIFFNESS * (zGoal - pz) - SPRING_Z_DAMPING * vz;
      velZ.current += accelZ * dt;
      posZ.current += velZ.current * dt;
      zTransform = ` translateZ(${posZ.current}px)`;
    }

    root.style.transform = `rotateX(${pos.current.rx}deg) rotateY(${pos.current.ry}deg)${zTransform}`;

    const rotStill =
      Math.abs(pos.current.rx) < 0.07 &&
      Math.abs(pos.current.ry) < 0.07 &&
      Math.abs(vel.current.rx) < 0.55 &&
      Math.abs(vel.current.ry) < 0.55;

    const zGoalForStill = extrude ? (!hover.current || freezeRef.current ? 0 : extrudeRef.current) : 0;
    const zStill =
      !extrude ||
      (Math.abs(posZ.current - zGoalForStill) < 1.1 && Math.abs(velZ.current) < 0.75);

    /* Only tear down rAF when pointer left; while hovered we keep the last transform applied. */
    const still = !hover.current && rotStill && zStill;

    if (still) {
      pos.current.rx = 0;
      pos.current.ry = 0;
      vel.current.rx = 0;
      vel.current.ry = 0;
      posZ.current = 0;
      velZ.current = 0;
      root.style.transform = "";
      rafId.current = null;
      lastTick.current = 0;
      return;
    }

    rafId.current = requestAnimationFrame(tick);
  }, []);

  const startLoop = useCallback(() => {
    if (rafId.current != null) return;
    lastTick.current = 0;
    rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  const onPointerMove = (e: React.MouseEvent) => {
    if (freezeRef.current) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const nx = x / r.width - 0.5;
    const ny = y / r.height - 0.5;
    const leverage = 0.45 + (1 - y / r.height) * 0.72;
    target.current.ry = nx * 2 * SPRING_MAX_RY * leverage;
    target.current.rx = -ny * 2 * SPRING_MAX_RX * leverage;
    startLoop();
  };

  const onPointerEnter = () => {
    hover.current = true;
    startLoop();
  };

  const onPointerLeave = () => {
    hover.current = false;
    target.current.rx = 0;
    target.current.ry = 0;
    startLoop();
  };

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    if (freeze) {
      target.current.rx = 0;
      target.current.ry = 0;
      posZ.current = 0;
      velZ.current = 0;
      startLoop();
    }
  }, [freeze, startLoop]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "50% 100%",
      }}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}

function TeamCardPhysicsDirect({ children, freeze, className }: Omit<Props, "disabled" | "mode">) {
  const rootRef = useRef<HTMLDivElement>(null);
  const freezeRef = useRef(freeze);
  freezeRef.current = freeze;

  const paint = useCallback((rx: number, ry: number, rz: number, leaving: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    root.style.transition = leaving
      ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "transform 50ms ease-out";
    if (rx === 0 && ry === 0 && rz === 0) {
      root.style.transform = "";
    } else {
      root.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${rz}px)`;
    }
  }, []);

  const onPointerMove = (e: React.MouseEvent) => {
    if (freezeRef.current) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const nx = x / r.width - 0.5;
    const ny = y / r.height - 0.5;
    const leverage = 0.48 + (1 - y / r.height) * 0.78;
    const rx = -ny * 2 * DIRECT_MAX_RX * leverage;
    const ry = nx * 2 * DIRECT_MAX_RY * leverage;
    const dist = Math.min(1, Math.hypot(nx * 2, ny * 2));
    const rz = dist * 28;
    paint(rx, ry, rz, false);
  };

  const onPointerEnter = () => {
    if (!freezeRef.current) {
      const root = rootRef.current;
      if (root) root.style.transition = "transform 50ms ease-out";
    }
  };

  const onPointerLeave = () => {
    paint(0, 0, 0, true);
  };

  useEffect(() => {
    if (freeze) paint(0, 0, 0, false);
  }, [freeze, paint]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "50% 100%",
      }}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}
