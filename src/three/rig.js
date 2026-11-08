import * as THREE from 'three';

// Animation des personnages articulés (models.js) : on calcule chaque image une
// « pose cible », puis chaque articulation la rejoint en douceur (amortissement
// exponentiel). Résultat : des mouvements fluides, même quand la pose change d'un coup.

const { damp } = THREE.MathUtils;

export const NEUTRAL = {
    a0x: 0, a0z: -0.16, a1x: 0, a1z: 0.16, // bras (rotation avant/arrière, écartement)
    l0x: 0, l1x: 0, // jambes
    tx: 0, tz: 0, ty: 0, // torse (penché avant, sur le côté, tourné)
    y: 0, z: 0, x: 0, // position du corps (saut, avancée, décalage)
    rx: 0, rz: 0, ry: 0, // rotation de tout le corps (chute, salto, toupie)
    s: 1, // échelle
};

/** Rapproche le modèle de la pose voulue ; « speed » règle la vivacité. */
export function applyPose(model, target, dt, speed = 14) {
    const u = model.userData;
    const p = { ...NEUTRAL, ...target };
    const k = Math.min(dt, 0.05);
    const go = (obj, prop, axis, value, lambda = speed) => {
        obj[prop][axis] = damp(obj[prop][axis], value, lambda, k);
    };
    go(u.arms[0], 'rotation', 'x', p.a0x);
    go(u.arms[0], 'rotation', 'z', p.a0z);
    go(u.arms[1], 'rotation', 'x', p.a1x);
    go(u.arms[1], 'rotation', 'z', p.a1z);
    go(u.legs[0], 'rotation', 'x', p.l0x);
    go(u.legs[1], 'rotation', 'x', p.l1x);
    go(u.torso, 'rotation', 'x', p.tx);
    go(u.torso, 'rotation', 'z', p.tz);
    go(u.torso, 'rotation', 'y', p.ty);
    go(u.rig, 'position', 'y', p.y);
    go(u.rig, 'position', 'z', p.z);
    go(u.rig, 'position', 'x', p.x);
    go(u.rig, 'rotation', 'x', p.rx);
    go(u.rig, 'rotation', 'z', p.rz);
    go(u.rig, 'rotation', 'y', p.ry);
    const s = damp(u.rig.scale.x, p.s, speed, k);
    u.rig.scale.setScalar(s);
}

/** Cycle de marche : jambes et bras en opposition, petit rebond à chaque pas. */
export function walkPose(phase, amount = 1, extra = {}) {
    const swing = Math.sin(phase);
    return {
        l0x: swing * 0.75 * amount,
        l1x: -swing * 0.75 * amount,
        a0x: -swing * 0.65 * amount,
        a1x: swing * 0.65 * amount,
        y: Math.abs(Math.cos(phase)) * 0.07 * amount,
        tz: swing * 0.05 * amount,
        tx: 0.08 * amount,
        ...extra,
    };
}

/** Garde de boxe : gants levés devant le visage, sautillement léger. */
export function guardPose(t, extra = {}) {
    const bounce = Math.abs(Math.sin(t * 5.2));
    return {
        a0x: -1.35 + Math.sin(t * 5.2) * 0.08,
        a1x: -1.25 - Math.sin(t * 5.2) * 0.08,
        a0z: 0.25,
        a1z: -0.25,
        y: bounce * 0.05,
        l0x: 0.12,
        l1x: -0.18,
        tx: 0.06,
        tz: Math.sin(t * 2.6) * 0.03,
        ...extra,
    };
}

/** Angle le plus court entre deux orientations (pour tourner sans faire le grand tour). */
export function turnToward(current, target, lambda, dt) {
    let delta = target - current;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    return current + delta * (1 - Math.exp(-lambda * Math.min(dt, 0.05)));
}

/** Courbes d'animation : 0 → 1. */
export const ease = {
    out: (x) => 1 - (1 - x) ** 3,
    inOut: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
    back: (x) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2,
};

/** Fenêtre de temps : 0 avant « from », 1 après « to », linéaire entre les deux. */
export const span = (t, from, to) => Math.min(1, Math.max(0, (t - from) / (to - from)));

/** Une impulsion 0 → 1 → 0 entre « from » et « to ». */
export const pulse = (t, from, to) => {
    const x = span(t, from, to);
    return Math.sin(x * Math.PI);
};
