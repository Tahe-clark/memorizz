import * as THREE from 'three';
import { dotTexture } from './models';
import { ease, span } from './rig';

// Coups finaux de Battle en 3D, clins d'œil aux animes :
//  kame   : les mains jointes à la hanche, une boule d'énergie, puis un énorme rayon
//  gum    : le bras s'étire en arrière comme un élastique, puis part comme un boulet
//  rafale : une pluie de poings (ORA ORA ORA !), puis un uppercut
//  rasen  : une sphère qui tourbillonne dans la main, plaquée sur l'adversaire
//  genki  : bras levés, une bombe d'énergie géante se forme au-dessus de la tête, puis tombe
// stage : 'charge' (1,9 s) puis 'blast' (0,9 s). « s » = secondes écoulées dans l'étape.

/** Instant où le coup touche (l'adversaire ne s'envole qu'à ce moment-là). */
export const HIT_AT = { kame: 0.1, gum: 0.1, rafale: 0.08, rasen: 0.16, genki: 0.32 };

const COLORS = { kame: 0x46c8ff, gum: 0xffb03a, rafale: 0xff4f86, rasen: 0x7ab8ff, genki: 0xbfe8ff };

/** Pose du vainqueur pendant son coup final (bras « fr » = celui côté caméra). */
export function finisherPose(move, stage, s, t, p) {
    const fr = p === 0 ? 0 : 1;
    const bk = 1 - fr;
    const A = (i) => `a${i}x`;
    const Z = (i) => `a${i}z`;
    const shake = Math.sin(t * 60) * 0.02;
    if (move === 'kame') {
        if (stage === 'charge') {
            const k = ease.out(span(s, 0, 0.5));
            return { pose: { y: -0.16 * k, x: shake, tx: 0.15, ty: (fr ? 0.6 : -0.6) * k, a0x: 0.9 * k, a1x: 0.9 * k, a0z: 0.55 * k, a1z: -0.55 * k, l0x: 0.35, l1x: -0.35 }, speed: 12 };
        }
        return { pose: { z: 0.2, y: -0.1, ty: 0, tx: 0.1, a0x: -1.57, a1x: -1.57, a0z: 0.32, a1z: -0.32, l0x: 0.4, l1x: -0.4, x: shake }, speed: 30 };
    }
    if (move === 'gum') {
        if (stage === 'charge') {
            return { pose: { tx: 0.25, ty: (fr ? -1 : 1) * 0.5, [A(fr)]: 1.3 + Math.sin(t * 9) * 0.1, [A(bk)]: -1.2, [Z(fr)]: 0, l0x: 0.3, l1x: -0.3, x: shake }, speed: 10 };
        }
        return { pose: { tx: 0.1, ty: (fr ? 1 : -1) * 0.35, [A(fr)]: -1.72, [Z(fr)]: 0, [A(bk)]: -1.2, z: 0.15 }, speed: 40 };
    }
    if (move === 'rafale') {
        if (stage === 'charge') {
            const rush = ease.out(span(s, 0.15, 0.45));
            const hit = Math.sin(t * 46);
            return { pose: { z: rush * 0.75, tx: 0.2, ty: hit * 0.3, [A(fr)]: -1.6 + hit * 0.55 * rush, [A(bk)]: -1.6 - hit * 0.55 * rush, [Z(fr)]: 0, [Z(bk)]: 0, y: Math.abs(hit) * 0.03 }, speed: 45 };
        }
        const up = ease.out(span(s, 0, 0.12));
        return { pose: { z: 0.75, y: up * 0.35, tx: -0.2 * up, [A(fr)]: -2.9 * up - 1.6 * (1 - up), [A(bk)]: -0.8, l0x: -0.3, l1x: 0.2 }, speed: 40 };
    }
    if (move === 'rasen') {
        if (stage === 'charge') {
            return { pose: { tx: 0.12, ty: (fr ? -1 : 1) * 0.2, [A(fr)]: -1.25, [Z(fr)]: 0, [A(bk)]: -1.0, [Z(bk)]: (bk ? -0.5 : 0.5), y: -0.06, x: shake }, speed: 12 };
        }
        const dash = ease.out(span(s, 0, 0.16));
        return { pose: { z: dash * 1.15, tx: 0.3, [A(fr)]: -1.6, [Z(fr)]: 0, [A(bk)]: 0.4, l0x: 0.5, l1x: -0.5 }, speed: 35 };
    }
    // genki
    if (stage === 'charge') {
        return { pose: { a0x: -3.0, a1x: -3.0, a0z: -0.25, a1z: 0.25, tx: -0.12, y: Math.sin(t * 3) * 0.02, x: shake }, speed: 8 };
    }
    const k = ease.out(span(s, 0, 0.25));
    return { pose: { a0x: -3.0 + k * 1.6, a1x: -3.0 + k * 1.6, a0z: 0, a1z: 0, tx: 0.35 * k, z: 0.1 }, speed: 25 };
}

/** Pose de la victime pendant la rafale : elle encaisse chaque coup. */
export function barragePose(t) {
    return { rx: -0.25 + Math.sin(t * 46) * 0.08, rz: Math.sin(t * 37) * 0.08, a0x: -2.2, a1x: -2.2, a0z: 0.3, a1z: -0.3, z: -0.25 };
}

const glow = (color, opacity = 0.9) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

/** Les effets d'énergie (boule, anneaux, rayon), créés une fois et réutilisés. */
export function createEnergy(group) {
    const ball = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glow(0xffffff, 1));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), glow(0x46c8ff, 0.45));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0x46c8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    halo.scale.setScalar(4.2);
    ball.add(core, shell, halo);
    const rings = [0, 1, 2].map((i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.07, 8, 40), glow(0x9fd4ff, 0.8));
        ring.rotation.set(i * 1.1, i * 0.7, 0);
        ball.add(ring);
        return ring;
    });
    ball.visible = false;
    group.add(ball);

    // Rayon le long de +x, de 0 à 1 (on l'étire avec scale.x)
    const beam = new THREE.Group();
    const tube = (radius, material) => {
        const geometry = new THREE.CylinderGeometry(radius, radius, 1, 20, 1, true);
        geometry.rotateZ(-Math.PI / 2);
        geometry.translate(0.5, 0, 0);
        return new THREE.Mesh(geometry, material);
    };
    const beamCore = tube(1, glow(0xffffff, 1));
    const beamOuter = tube(2.1, glow(0x46c8ff, 0.5));
    beam.add(beamCore, beamOuter);
    beam.visible = false;
    group.add(beam);
    const light = new THREE.PointLight(0x46c8ff, 0, 6, 1.5);
    group.add(light);
    return { ball, core, shell, halo, rings, beam, beamCore, beamOuter, light };
}

/**
 * Anime les effets d'énergie du coup final.
 * ctx : { move, stage, s, t, dt, winner (modèle), loser (modèle), p (côté du vainqueur), fx, kick(force) }
 */
export function updateEnergy(energy, ctx) {
    const { move, stage, s, t, winner, loser, p, fx, kick } = ctx;
    const { ball, shell, halo, rings, beam, beamCore, beamOuter, light } = energy;
    const dir = p === 0 ? 1 : -1;
    const color = new THREE.Color(COLORS[move] ?? 0xffffff);
    shell.material.color.copy(color);
    halo.material.color.copy(color);
    beamOuter.material.color.copy(color);
    light.color.copy(color);
    rings.forEach((ring) => { ring.visible = move === 'rasen'; });
    ball.visible = false;
    beam.visible = false;
    light.intensity = 0;
    if (!move || !stage || stage === 'done') return;

    const u = winner.userData;
    const fr = p === 0 ? 0 : 1;
    const gloves = u.arms.map((arm) => arm.userData.glove.getWorldPosition(new THREE.Vector3()));
    const hands = gloves[0].clone().lerp(gloves[1], 0.5);
    const target = loser.localToWorld(new THREE.Vector3(0, 1.0, 0));
    const at = (ms) => s >= ms;
    const once = (name) => {
        if (ctx.fired.has(name)) return false;
        ctx.fired.add(name);
        return true;
    };

    if (move === 'kame') {
        ball.visible = true;
        light.intensity = 8;
        if (stage === 'charge') {
            const r = 0.06 + ease.out(span(s, 0.3, 1.8)) * 0.24 + Math.sin(t * 30) * 0.015;
            ball.scale.setScalar(r);
            ball.position.copy(hands);
            light.position.copy(hands);
            if (Math.random() < ctx.dt * 30) fx.burst(hands.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2)), { color, size: 0.25, life: 0.3, texture: dotTexture() });
        } else {
            const grow = ease.out(span(s, 0, 0.12));
            const fade = 1 - span(s, 0.6, 0.9);
            ball.scale.setScalar(0.4 * fade + 0.05);
            ball.position.copy(hands);
            beam.visible = true;
            beam.position.copy(hands);
            beam.rotation.y = dir > 0 ? 0 : Math.PI;
            beam.scale.set(9 * grow, (0.2 + Math.sin(t * 50) * 0.02) * fade, (0.2 + Math.sin(t * 50) * 0.02) * fade);
            beamCore.material.opacity = fade;
            beamOuter.material.opacity = 0.5 * fade;
            light.position.copy(hands).add(new THREE.Vector3(dir * 1.5, 0, 0));
            light.intensity = 25 * fade;
            if (at(HIT_AT.kame) && once('kame-hit')) {
                fx.burst(target, { color, size: 3.4, life: 0.5 });
                kick(0.3);
            }
        }
    } else if (move === 'gum') {
        // Le bras s'étire : on étire l'épaule et on garde le gant bien rond
        const shoulder = u.arms[fr];
        let stretch = 1;
        if (stage === 'charge') stretch = 1 + ease.out(span(s, 0.25, 1.6)) * 1.6 + Math.sin(t * 14) * 0.08;
        else {
            const out = ease.out(span(s, 0, 0.09));
            const back = ease.inOut(span(s, 0.35, 0.65));
            stretch = THREE.MathUtils.lerp(2.6, 4.6, out) * (1 - back) + back;
            if (at(HIT_AT.gum) && once('gum-hit')) {
                fx.burst(target, { color: 0xffe08a, size: 2.8, life: 0.4 });
                kick(0.28);
            }
        }
        shoulder.scale.set(1, stretch, 1);
        shoulder.userData.glove.scale.set(stretch > 1.5 ? 1.25 : 1, 1.1 / stretch * (stretch > 1.5 ? 1.25 : 1), 0.95);
    } else if (move === 'rafale') {
        if (stage === 'charge' && s > 0.45) {
            // Pluie de poings fantômes et petits impacts en continu
            const front = loser.localToWorld(new THREE.Vector3(0, 1.0, 0.55));
            for (let i = 0; i < 3; i++) {
                if (Math.random() < ctx.dt * 22) {
                    fx.burst(front.clone().add(new THREE.Vector3(-dir * (0.2 + Math.random() * 0.5), (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7)), { color: new THREE.Color(winner.userData.arms[0].userData.glove.material.color), size: 0.55, life: 0.14, texture: dotTexture() });
                }
            }
            if (Math.random() < ctx.dt * 9) fx.burst(front.clone().add(new THREE.Vector3(0, (Math.random() - 0.5) * 0.8, 0)), { size: 0.7, life: 0.18 });
            kick(0.04);
        }
        if (stage === 'blast' && at(HIT_AT.rafale) && once('rafale-hit')) {
            fx.burst(target.clone().add(new THREE.Vector3(0, 0.3, 0)), { color: 0xff7aa8, size: 3.2, life: 0.45 });
            kick(0.3);
        }
    } else if (move === 'rasen') {
        ball.visible = true;
        const glove = gloves[fr].clone().add(new THREE.Vector3(dir * 0.25, 0, 0));
        light.intensity = 7;
        if (stage === 'charge') {
            ball.scale.setScalar(0.05 + ease.out(span(s, 0.2, 1.6)) * 0.22);
            ball.position.copy(glove);
        } else {
            const pop = span(s, HIT_AT.rasen, HIT_AT.rasen + 0.25);
            ball.scale.setScalar(0.27 + pop * 0.7);
            ball.position.copy(glove);
            ball.visible = pop < 1;
            ball.children.forEach((m) => { if (m.material) m.material.opacity = (m === energy.core ? 1 : 0.6) * (1 - pop); });
            if (at(HIT_AT.rasen) && once('rasen-hit')) {
                fx.burst(target, { color, size: 3.6, life: 0.55 });
                kick(0.32);
            }
        }
        if (stage === 'charge') ball.children.forEach((m) => { if (m.material) m.material.opacity = m === energy.core ? 1 : m.isSprite ? 1 : 0.6; });
        rings.forEach((ring, i) => {
            ring.rotation.x += ctx.dt * (8 + i * 3);
            ring.rotation.y += ctx.dt * (6 - i * 2);
        });
        light.position.copy(ball.position);
        if (stage === 'charge' && Math.random() < ctx.dt * 25) {
            const a = Math.random() * Math.PI * 2;
            fx.burst(glove.clone().add(new THREE.Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0)), { color, size: 0.2, life: 0.25, texture: dotTexture() });
        }
    } else if (move === 'genki') {
        ball.visible = true;
        const above = winner.localToWorld(new THREE.Vector3(0, u.height + 1.25, 0));
        if (stage === 'charge') {
            const r = 0.08 + ease.out(span(s, 0.2, 1.85)) * 0.75;
            ball.scale.setScalar(r + Math.sin(t * 8) * 0.02);
            ball.position.copy(above);
            light.position.copy(above);
            light.intensity = 6 + r * 10;
            // L'énergie du public converge vers la boule
            if (Math.random() < ctx.dt * 30) {
                const from = above.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 2.5 - 0.5, -1 - Math.random() * 2));
                fx.burst(from.lerp(above, Math.random() * 0.6), { color, size: 0.3, life: 0.35, texture: dotTexture() });
            }
        } else {
            const k = ease.inOut(span(s, 0.05, HIT_AT.genki));
            const pos = above.clone().lerp(target, k);
            pos.y += Math.sin(k * Math.PI) * 0.6;
            ball.scale.setScalar(0.83);
            ball.position.copy(pos);
            ball.visible = k < 1;
            light.position.copy(pos);
            light.intensity = 18;
            if (at(HIT_AT.genki) && once('genki-hit')) {
                fx.burst(target, { color: 0xffffff, size: 5.5, life: 0.7 });
                fx.burst(target, { color, size: 3.5, life: 0.9, texture: dotTexture() });
                kick(0.4);
            }
        }
    }
}
