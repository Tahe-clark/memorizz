import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createEngine } from './engine';
import { avatarModel, canvasTexture, dispose, dotTexture, mat, setMood, shadowy } from './models';
import { applyPose, ease, guardPose, pulse, span, turnToward, walkPose } from './rig';
import { cowboyLook, fighterMood, fighterState } from '../utils/battle';
import { barragePose, createEnergy, finisherPose, HIT_AT, updateEnergy } from './finishers';

// Battle en vraie 3D (Three.js) : le ring et ses projecteurs, le duel au Far West
// au coucher du soleil, et le podium sous les confettis. Les personnages sont les
// avatars articulés de models.js ; chaque état du combat (coup, esquive, contre,
// K.O., coup final, tir…) devient une petite chorégraphie calée sur les sons.
// mode : 'ring' | 'duel' | 'podium'. Chargé seulement en vue 3D (React.lazy).

const GAP = { ring: 1.25, duel: 1.75, podium: 0 };

// ---------- Effets ----------

let starTex = null;
function starTexture() {
    if (!starTex) {
        starTex = canvasTexture(128, 128, (c, w) => {
            c.translate(w / 2, w / 2);
            c.fillStyle = '#fff6c2';
            c.beginPath();
            for (let i = 0; i < 20; i++) {
                const r = i % 2 ? 22 : 62;
                const a = (i / 20) * Math.PI * 2;
                c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            c.fill();
            c.fillStyle = '#ffd23f';
            c.beginPath();
            c.arc(0, 0, 22, 0, 7);
            c.fill();
        });
    }
    return starTex;
}

/** Petits effets éphémères : éclairs d'impact, flashs de tir, fumée. */
function makeFx(scene) {
    const items = [];
    return {
        burst(position, { color = 0xffffff, size = 1.2, life = 0.32, texture = starTexture() } = {}) {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
            sprite.position.copy(position);
            scene.add(sprite);
            items.push({ sprite, age: 0, life, size, kind: 'burst', spin: (Math.random() - 0.5) * 4 });
        },
        smoke(position, direction) {
            for (let i = 0; i < 9; i++) {
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xd9d2c4, transparent: true, depthWrite: false, opacity: 0.7 }));
                sprite.position.copy(position);
                scene.add(sprite);
                const v = direction.clone().multiplyScalar(0.6 + Math.random() * 1.2).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4));
                items.push({ sprite, age: -i * 0.03, life: 1.6 + Math.random() * 0.6, size: 0.35, kind: 'smoke', v });
            }
        },
        tracer(from, to) {
            const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xfff2b0, transparent: true, toneMapped: false }));
            scene.add(line);
            items.push({ sprite: line, age: 0, life: 0.12, kind: 'line' });
        },
        update(dt) {
            for (let i = items.length - 1; i >= 0; i--) {
                const it = items[i];
                it.age += dt;
                if (it.age < 0) continue;
                const x = it.age / it.life;
                if (x >= 1) {
                    scene.remove(it.sprite);
                    if (it.kind === 'line') it.sprite.geometry.dispose();
                    it.sprite.material.dispose();
                    items.splice(i, 1);
                    continue;
                }
                if (it.kind === 'burst') {
                    const s = it.size * (0.4 + ease.out(x) * 0.9);
                    it.sprite.scale.set(s, s, 1);
                    it.sprite.material.opacity = 1 - x * x;
                    it.sprite.material.rotation += it.spin * dt;
                } else if (it.kind === 'smoke') {
                    it.sprite.position.addScaledVector(it.v, dt);
                    it.v.multiplyScalar(1 - dt * 1.6);
                    it.v.y += dt * 0.25;
                    const s = it.size + x * 1.3;
                    it.sprite.scale.set(s, s, 1);
                    it.sprite.material.opacity = 0.6 * (1 - x);
                } else {
                    it.sprite.material.opacity = 1 - x;
                }
            }
        },
        clear() {
            items.forEach((it) => {
                scene.remove(it.sprite);
                it.sprite.material.dispose();
            });
            items.length = 0;
        },
    };
}

// ---------- Décors ----------

function buildRing(group, players) {
    const canvas = canvasTexture(512, 360, (c, w, h) => {
        c.fillStyle = '#2f4fd8';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(255,255,255,0.85)';
        c.lineWidth = 8;
        c.strokeRect(14, 14, w - 28, h - 28);
        c.fillStyle = 'rgba(255,255,255,0.14)';
        c.font = 'bold 66px "Bricolage Grotesque", Arial, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('MEMORIZZ', w / 2, h / 2);
        c.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 1500; i++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    });
    const W = 6;
    const D = 4.2;
    const top = new THREE.Mesh(new RoundedBoxGeometry(W, 0.4, D, 3, 0.06), [mat(0x1d2a6e), mat(0x1d2a6e), mat(0xffffff, { map: canvas, r: 0.9 }), mat(0x1d2a6e), mat(0x26338a), mat(0x1d2a6e)]);
    top.position.y = -0.2;
    top.receiveShadow = true;
    group.add(top);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.9, D - 0.1), mat(0x0e1236));
    skirt.position.y = -0.85;
    group.add(skirt);
    // Poteaux aux couleurs des joueurs et cordes (fond et côtés)
    const corners = [[-W / 2 + 0.15, -D / 2 + 0.15, 0], [W / 2 - 0.15, -D / 2 + 0.15, 1], [-W / 2 + 0.15, D / 2 - 0.15, 0], [W / 2 - 0.15, D / 2 - 0.15, 1]];
    corners.forEach(([x, z, p]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 12), mat(0xd9d9e0, { m: 0.7, r: 0.3 }));
        post.position.set(x, 0.75, z);
        group.add(shadowy(post));
        const pad = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.9, 0.24, 2, 0.06), mat(players[p].color, { r: 0.5 }));
        pad.position.set(x, 0.8, z);
        group.add(shadowy(pad));
    });
    const ropeMaterial = mat(0xf5f5f5, { r: 0.45 });
    const rope = (a, b, y) => {
        const from = new THREE.Vector3(a[0], y, a[1]);
        const to = new THREE.Vector3(b[0], y, b[1]);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, from.distanceTo(to), 8), ropeMaterial);
        mesh.position.copy(from).lerp(to, 0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
        group.add(shadowy(mesh));
    };
    [0.55, 0.9, 1.25].forEach((y) => {
        rope([corners[0][0], corners[0][1]], [corners[1][0], corners[1][1]], y);
        rope([corners[0][0], corners[0][1]], [corners[2][0], corners[2][1]], y);
        rope([corners[1][0], corners[1][1]], [corners[3][0], corners[3][1]], y);
    });
    // Public dans l'ombre, et flashs d'appareils photo
    const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.22, 0.4, 4, 8), mat(0x1b1838, { r: 1 }), 90);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 90; i++) {
        const row = Math.floor(i / 30);
        const x = -8 + (i % 30) * 0.55 + (row % 2) * 0.27;
        m.makeTranslation(x, -0.4 + row * 0.55 + Math.sin(i * 7.1) * 0.08, -4.2 - row * 0.9);
        crowd.setMatrixAt(i, m);
    }
    group.add(crowd);
    const flashes = [];
    for (let i = 0; i < 7; i++) {
        const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        flash.scale.setScalar(0.5);
        group.add(flash);
        flashes.push(flash);
    }
    return { flashes, crowd };
}

function buildDesert(group) {
    // Ciel du couchant (dôme), soleil, mesas, sable, cactus et virevoltant
    const sky = canvasTexture(16, 256, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#3a1c5a');
        g.addColorStop(0.35, '#d9483b');
        g.addColorStop(0.55, '#ff9a4d');
        g.addColorStop(0.62, '#ffd28a');
        g.addColorStop(1, '#ffd28a');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false }));
    group.add(dome);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: 0xffe6a8, fog: false, toneMapped: false }));
    sun.position.set(3, 3.2, -45);
    group.add(sun);
    const sand = canvasTexture(256, 256, (c, w, h) => {
        c.fillStyle = '#e0a35c';
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 3000; i++) {
            c.fillStyle = `rgba(${Math.random() < 0.5 ? '120,70,30' : '255,230,180'},${Math.random() * 0.18})`;
            c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
    });
    sand.wrapS = THREE.RepeatWrapping;
    sand.wrapT = THREE.RepeatWrapping;
    sand.repeat.set(10, 10);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(55, 48), mat(0xffffff, { map: sand, r: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);
    const rock = mat(0x9a4a2e, { r: 0.95 });
    [[-14, -30, 9, 5, 4], [-3, -36, 6, 3.4, 3], [12, -28, 10, 6, 5], [24, -34, 7, 4, 4], [-26, -26, 6, 3, 3]].forEach(([x, z, w, h, d]) => {
        const mesa = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.55, h, 7), rock);
        mesa.scale.z = d / w;
        mesa.position.set(x, h / 2, z);
        group.add(mesa);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.42, 0.4, 7), mat(0x7a3a24));
        cap.scale.z = d / w;
        cap.position.set(x, h + 0.2, z);
        group.add(cap);
    });
    const green = mat(0x3f8a4a, { r: 0.7 });
    const cactus = (x, z, s) => {
        const c = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.6, 6, 12), green);
        trunk.position.y = 1;
        c.add(trunk);
        [[-1, 0.9, 0.5], [1, 1.25, 0.4]].forEach(([side, y, len]) => {
            const out = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.35, 4, 10), green);
            out.rotation.z = Math.PI / 2;
            out.position.set(side * 0.35, y, 0);
            c.add(out);
            const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, len, 4, 10), green);
            up.position.set(side * 0.55, y + len / 2 + 0.05, 0);
            c.add(up);
        });
        c.position.set(x, 0, z);
        c.scale.setScalar(s);
        group.add(shadowy(c));
    };
    cactus(-4.6, -3.2, 1);
    cactus(5.2, -4.5, 1.25);
    cactus(-7.5, -8, 1.4);
    cactus(8.5, -10, 1.6);
    cactus(1.2, -12, 1.1);
    // Virevoltant
    const weed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), new THREE.MeshStandardMaterial({ color: 0x8a5a2b, wireframe: true }));
    group.add(weed);
    // Poussière qui flotte
    const dustCount = 60;
    const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(dustCount * 3), 3)), new THREE.PointsMaterial({ size: 0.08, color: 0xffe0b0, transparent: true, opacity: 0.6, depthWrite: false }));
    group.add(dust);
    return { weed, dust };
}

function buildPodium(group, players, winner) {
    const steps = [];
    const numberTexture = (n) => canvasTexture(128, 128, (c, w) => {
        c.fillStyle = 'rgba(0,0,0,0)';
        c.clearRect(0, 0, w, w);
        c.font = 'bold 100px "Bricolage Grotesque", Arial, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineWidth = 12;
        c.strokeStyle = '#000';
        c.strokeText(String(n), w / 2, w / 2 + 6);
        c.fillStyle = '#fff';
        c.fillText(String(n), w / 2, w / 2 + 6);
    });
    [[winner, 1, 0.75, 1.05], [1 - winner, 2, -0.95, 0.6]].forEach(([player, rank, x, h]) => {
        const step = new THREE.Mesh(new RoundedBoxGeometry(1.6, h, 1.3, 3, 0.08), mat(players[player].color, { r: 0.5 }));
        step.position.set(x, h / 2, 0);
        group.add(shadowy(step));
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: numberTexture(rank), transparent: true }));
        label.position.set(x, h / 2, 0.66);
        group.add(label);
        steps.push({ player, rank, x, h });
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), mat(0x2a1f4a, { r: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);
    // Faisceaux de projecteurs visibles
    const beams = [];
    [-2.4, 0.75, 3.2].forEach((x, i) => {
        const beam = new THREE.Mesh(new THREE.ConeGeometry(1.1, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: [0xff6fa8, 0xffe08a, 0x7ac8ff][i], transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        beam.position.set(x, 3.3, -0.6);
        group.add(beam);
        beams.push(beam);
    });
    // Confettis
    const count = 160;
    const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.14), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 }), count);
    const palette = [0xffd23f, 0xe5383b, 0x2f6fed, 0x2bd46a, 0xff6fa8, 0xffffff].map((c) => new THREE.Color(c));
    const seeds = [];
    for (let i = 0; i < count; i++) {
        confetti.setColorAt(i, palette[i % palette.length]);
        seeds.push({ x: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 4 - 0.5, y: Math.random() * 6, v: 0.6 + Math.random() * 0.8, spin: Math.random() * 6, phase: Math.random() * 6 });
    }
    group.add(confetti);
    return { steps, beams, confetti, seeds };
}

// ---------- Chorégraphies ----------

/** Pose d'un boxeur selon son état ; renvoie aussi les « événements » (impacts) à déclencher. */
function ringPose(state, since, t, p, player, hpLow) {
    const has = (c) => state.includes(c);
    const front = p === 0 ? 0 : 1; // le bras côté caméra
    const back = 1 - front;
    const armX = (i) => `a${i}x`;
    const armZ = (i) => `a${i}z`;
    let pose = guardPose(t * (hpLow ? 0.7 : 1) + p * 0.7, hpLow ? { tx: 0.22 } : {});
    let speed = 14;
    const punch = (start) => {
        const wind = pulse(since, start, start + 0.14);
        const strike = span(since, start + 0.1, start + 0.2) * (1 - span(since, start + 0.32, start + 0.55));
        pose[armX(front)] = THREE.MathUtils.lerp(pose[armX(front)], -0.7, wind);
        pose[armX(front)] = THREE.MathUtils.lerp(pose[armX(front)], -1.68, strike);
        pose[armZ(front)] = THREE.MathUtils.lerp(pose[armZ(front)], 0, strike);
        pose.z = strike * 0.55;
        pose.ty = (front ? 1 : -1) * (wind * 0.25 - strike * 0.45);
        speed = 26;
    };
    const recoil = (start) => {
        const k = pulse(since, start, start + 0.55);
        pose.z = -k * 0.45;
        pose.rx = -k * 0.4;
        pose.tx = -k * 0.2;
        speed = 24;
    };
    if (has('is-charging')) {
        // Coup final : il se ramasse, poings en arrière, et tremble de puissance
        pose = { ...pose, y: -0.12, tx: 0.35, [armX(front)]: 0.7, [armX(back)]: -1.4, x: Math.sin(t * 60) * 0.025 };
        if (has('is-megapunch')) {
            const k = ease.out(span(since, 0, 0.18));
            pose = { ...pose, z: k * 1.25, tx: 0.15, [armX(front)]: -1.7, [armZ(front)]: 0 };
            speed = 30;
        }
    } else if (has('is-scared')) {
        pose = { ...pose, [armX(front)]: -2.5, [armX(back)]: -2.4, a0z: 0.4, a1z: -0.4, rx: -0.15, x: Math.sin(t * 55) * 0.03, y: 0 };
    } else if (has('is-blasted')) {
        // Il s'envole hors du ring en tournoyant
        const k = span(since, 0.05, 1.1);
        pose = { ...pose, z: -k * 7, y: Math.sin(k * Math.PI) * 3, rx: -k * 9, a0x: -2.8, a1x: -2.8, l0x: 0.8, l1x: -0.6 };
        speed = 40;
    } else {
        if (has('is-punching')) punch(0);
        if (has('is-hit')) recoil(0.16);
        if (has('is-countered')) {
            // Il frappe dans le vide, emporté par son élan… puis le contre le touche
            const whiff = span(since, 0.05, 0.25) * (1 - span(since, 0.45, 0.7));
            pose[armX(front)] = THREE.MathUtils.lerp(pose[armX(front)], -1.7, whiff);
            pose.z = whiff * 0.75;
            pose.rx = whiff * 0.22;
            speed = 24;
            if (since > 0.61) recoil(0.61);
        }
        if (has('is-countering')) {
            // Esquive sur le côté, puis contre-attaque
            const dodge = pulse(since, 0, 0.55);
            pose.rz = (p === 0 ? 1 : -1) * dodge * 0.45;
            pose.y = -dodge * 0.15;
            pose.x = (p === 0 ? -1 : 1) * dodge * 0.25;
            speed = 22;
            if (since > 0.45) punch(0.45);
        }
        if (has('is-ko')) {
            const start = has('is-countered') ? 1.0 : 0.3;
            const k = ease.out(span(since, start, start + 0.6));
            if (k > 0) pose = { ...pose, rx: -k * 1.5, y: k * 0.22, z: -k * 0.3, a0x: -k * 2.6, a1x: -k * 2.4, l0x: -k * 0.4, l1x: 0, a0z: -0.6 * k, a1z: 0.6 * k };
            speed = 12;
        }
        if (has('is-winner')) {
            const start = has('is-countering') ? 1.4 : 0.6;
            if (since > start) pose = celebrate(player.emote, since - start, pose);
        }
    }
    return { pose, speed };
}

/** Célébration selon l'emote choisie par le joueur. */
function celebrate(emote, x, base = {}) {
    const hop = Math.abs(Math.sin(x * 6.5));
    const up = { a0x: -2.9, a1x: -2.9, a0z: -0.35, a1z: 0.35 };
    if (emote === 'spin') return { ...base, ...up, ry: x * 9, y: hop * 0.12, tx: 0, rx: 0, z: 0 };
    if (emote === 'wiggle') return { ...base, ...up, rz: Math.sin(x * 14) * 0.25, tz: -Math.sin(x * 14) * 0.2, y: 0.02, rx: 0, z: 0 };
    if (emote === 'pump') return { ...base, a0x: -0.3, a1x: -2.9 + Math.sin(x * 12) * 0.35, a1z: 0.2, y: hop * 0.08, rx: 0, z: 0 };
    if (emote === 'flip') {
        const cycle = (x % 1.3) / 1.3;
        return { ...base, ...up, y: Math.sin(Math.min(1, cycle / 0.6) * Math.PI) * 0.9, rx: -ease.inOut(Math.min(1, cycle / 0.6)) * Math.PI * 2, z: 0 };
    }
    return { ...base, ...up, y: hop * 0.45, rx: 0, z: 0, l0x: -hop * 0.3, l1x: -hop * 0.3 };
}

/** Pose d'un cowboy pendant le duel. Le bras armé est celui côté caméra. */
function duelPose(state, phase, since, t, p, intro) {
    const gun = p === 0 ? 0 : 1;
    const other = 1 - gun;
    const gx = `a${gun}x`;
    const ox = `a${other}x`;
    const breathe = Math.sin(t * 2 + p);
    // Main qui frémit au-dessus de l'étui
    let pose = { [gx]: -0.15 + Math.sin(t * 9 + p) * 0.03, [ox]: 0.05, y: breathe * 0.01, tz: breathe * 0.01, l0x: 0.08, l1x: -0.08 };
    let speed = 12;
    if (intro !== null) {
        // Entrée de la cinématique : chacun marche vers sa position
        const k = span(intro, 0.9, 2.5);
        if (k > 0 && k < 1) pose = walkPose(intro * 9, 1, {});
    }
    if (state === 'is-taunting') {
        // Il touche son chapeau, sourire en coin, puis lève lentement l'arme
        const tip = pulse(since, 0, 0.9);
        pose = { ...pose, [ox]: -2.6 * tip, [`a${other}z`]: (other ? 0.5 : -0.5) * tip, [gx]: -1.57 * ease.inOut(span(since, 0.9, 1.6)), ty: (gun ? -1 : 1) * 0.15 };
    } else if (state === 'is-shooter') {
        const aim = ease.out(span(since, 0, 0.08));
        const kick = pulse(since, 0.08, 0.3);
        pose = { ...pose, [gx]: -1.57 * aim - kick * 0.55, tx: -kick * 0.12 };
        speed = 40;
        if (since > 0.9) pose = { ...pose, ...celebrate('jump', since - 0.9), [gx]: -2.8 };
    } else if (state === 'is-missing') {
        const aim = ease.out(span(since, 0, 0.08));
        const kick = pulse(since, 0.08, 0.3);
        const lower = span(since, 0.5, 1.0);
        pose = { ...pose, [gx]: (-1.57 * aim - kick * 0.55) * (1 - lower) - 0.2 * lower, rx: -0.08 * lower, x: lower ? Math.sin(t * 50) * 0.02 : 0 };
        speed = 30;
    } else if (state === 'is-shot') {
        const hit = span(since, 0.12, 0.3);
        const fall = ease.out(span(since, 0.25, 0.95));
        pose = { ...pose, [gx]: -1.2 * hit, rz: (p === 0 ? 1 : -1) * hit * 0.2, rx: -fall * 1.5, y: fall * 0.22, z: -fall * 0.4 - hit * 0.2, a0x: -2.4 * fall, a1x: -2.2 * fall };
        speed = 20;
    } else if (phase === 'duel' || phase === 'duelPeek') {
        pose = { ...pose, [gx]: -0.25 + Math.sin(t * 14 + p) * 0.06, y: -0.04, l0x: 0.2, l1x: -0.2, tx: 0.08 };
    }
    return { pose, speed };
}

export default function Battle3D({ mode, battle = null, players, winner = 0, onFail }) {
    const mountRef = useRef(null);
    const worldRef = useRef(null);
    const propsRef = useRef({ battle, players, winner });
    useEffect(() => {
        propsRef.current = { battle, players, winner };
    });
    const playersKey = JSON.stringify(players);

    useEffect(() => {
        const mount = mountRef.current;
        let engine;
        const options = {
            ring: { background: 0x0f0d24, exposure: 1.25, bloom: [0.55, 0.5, 0.82], fov: 34, ratio: 0.48, maxVh: 0.4, minHeight: 200 },
            duel: { background: 0xffb070, exposure: 1.15, bloom: [0.5, 0.6, 0.8], fov: 34, ratio: 0.48, maxVh: 0.4, minHeight: 200 },
            podium: { background: 0x140f2c, exposure: 1.25, bloom: [0.6, 0.5, 0.8], fov: 36, ratio: 0.62, maxVh: 0.46, minHeight: 220 },
        }[mode];
        try {
            engine = createEngine(mount, options);
        } catch {
            onFail?.();
            return undefined;
        }
        const { scene, camera } = engine;
        const group = new THREE.Group();
        scene.add(group);
        const fx = makeFx(scene);
        const players0 = propsRef.current.players;

        // Lumières
        if (mode === 'duel') {
            scene.fog = new THREE.Fog(0xffb070, 18, 58);
            scene.add(new THREE.HemisphereLight(0xffc89a, 0x8a4a2a, 1.6));
            const sun = new THREE.DirectionalLight(0xffb36b, 3.2);
            sun.position.set(-4, 4, -10);
            sun.castShadow = true;
            sun.shadow.mapSize.set(2048, 2048);
            Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6 });
            scene.add(sun);
            const fill = new THREE.DirectionalLight(0xffe2c0, 1.2);
            fill.position.set(2, 3, 8);
            scene.add(fill);
        } else {
            scene.fog = new THREE.Fog(options.background, 9, 22);
            scene.add(new THREE.HemisphereLight(0x8fa0ff, 0x221a3a, 1.1));
            const key = new THREE.SpotLight(0xffffff, 60, 16, 0.55, 0.5, 1.4);
            key.position.set(0, 7.5, 3.5);
            key.target.position.set(0, 0.5, 0);
            key.castShadow = true;
            key.shadow.mapSize.set(1024, 1024);
            scene.add(key, key.target);
            [0, 1].forEach((p) => {
                const rim = new THREE.PointLight(new THREE.Color(players0[p].color), 14, 7, 1.5);
                rim.position.set(p ? 3.2 : -3.2, 2.4, -1.2);
                scene.add(rim);
            });
        }

        // Décor
        const decor = mode === 'ring' ? buildRing(group, players0) : mode === 'duel' ? buildDesert(group) : buildPodium(group, players0, propsRef.current.winner);

        // Les deux personnages
        const fighters = [0, 1].map((p) => {
            const isDuel = mode === 'duel';
            const model = avatarModel(players0[p], 'angry', isDuel ? { accessory: 'cowboy', gun: true, gunArm: p === 0 ? 0 : 1 } : {});
            const facing = p === 0 ? Math.PI / 2 : -Math.PI / 2;
            if (mode === 'podium') {
                const step = decor.steps.find((s) => s.player === p);
                model.position.set(step.x, step.h, 0.05);
            } else {
                model.position.set(p === 0 ? -GAP[mode] : GAP[mode], 0, 0);
                model.rotation.y = facing;
            }
            group.add(model);
            // Étoiles du K.O. qui tournent au-dessus de la tête
            const stars = [0, 1, 2].map(() => {
                const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTexture(), transparent: true, depthWrite: false, toneMapped: false }));
                star.scale.setScalar(0.22);
                star.visible = false;
                group.add(star);
                return star;
            });
            // Aura du coup final
            const aura = new THREE.Mesh(
                new THREE.CylinderGeometry(0.75, 0.95, 2.4, 24, 1, true),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(players0[p].gloves), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }),
            );
            aura.position.y = 1.1;
            model.add(aura);
            return { model, facing, key: '', since: 0, fired: new Set(), stars, aura, gloveScale: 1, flash: 0 };
        });
        worldRef.current = { fighters };
        // Effets du coup final façon anime (boule d'énergie, rayon, sphère…)
        const energy = mode === 'ring' ? createEnergy(group) : null;
        const energyFired = new Set();
        let stageKey = null;
        let stageSince = 0;

        const camPos = new THREE.Vector3();
        let shake = 0;
        const fire = (f, name) => {
            if (f.fired.has(name)) return false;
            f.fired.add(name);
            return true;
        };
        const headOf = (f) => f.model.localToWorld(new THREE.Vector3(0, 1.45, 0.3));
        let phaseKey = '';
        let phaseSince = 0;

        const off = engine.onFrame((t, dt) => {
            const { battle: b, players: ps, winner: w } = propsRef.current;
            const k = Math.min(dt, 0.05);
            fx.update(dt);
            if (b && b.phase !== phaseKey) {
                phaseKey = b.phase;
                phaseSince = 0;
            }
            phaseSince += dt;
            const stage = b?.finisherStage ?? null;
            const move = b?.finisherMove ?? null;
            if (stage !== stageKey) {
                stageKey = stage;
                stageSince = 0;
                energyFired.clear();
            }
            stageSince += dt;
            const anime = mode === 'ring' && move && (stage === 'charge' || stage === 'blast');

            fighters.forEach((f, p) => {
                // Chaque nouvel état (ou nouvel événement) relance sa chorégraphie
                let state = '';
                let mood = 'angry';
                if (mode === 'ring' && b) {
                    state = fighterState(p, b);
                    mood = fighterMood(p, b);
                } else if (mode === 'duel' && b) {
                    const look = cowboyLook(p, b);
                    state = look.state;
                    mood = look.mood;
                } else if (mode === 'podium') {
                    state = p === w ? 'is-winner' : 'is-loser';
                    mood = p === w ? 'happy' : 'sad';
                }
                const key = `${state}|${b?.event.id ?? 0}`;
                if (key !== f.key) {
                    // Le coup final ne repart pas de zéro entre « charge » et « blast »
                    if (!(f.key.includes('is-charging') && state.includes('is-charging'))) f.since = 0;
                    f.key = key;
                    f.fired.clear();
                }
                f.since += dt;
                setMood(f.model, mood);

                let result;
                if (anime && p === b.roundWinner) {
                    result = finisherPose(move, stage, stageSince, t, p);
                } else if (anime && state.includes('is-blasted')) {
                    // La victime ne s'envole qu'au moment où le coup la touche
                    result = ringPose(state, f.since - HIT_AT[move], t, p, ps[p], true);
                } else if (anime && move === 'rafale' && stageSince > 0.45) {
                    result = { pose: barragePose(t), speed: 30 };
                } else if (mode === 'ring') {
                    result = ringPose(state, f.since, t, p, ps[p], b.hp[p] <= 34);
                } else if (mode === 'duel') {
                    result = duelPose(state, b.phase, f.since, t, p, b.phase === 'duelIntro' ? phaseSince : null);
                } else {
                    result = p === w
                        ? { pose: celebrate(ps[p].emote, t), speed: 12 }
                        : { pose: { tx: 0.3, a0x: 0.1, a1x: 0.1, y: Math.sin(t * 1.5) * 0.01, ty: Math.sin(t * 0.6) * 0.15 }, speed: 6 };
                }
                applyPose(f.model, result.pose, dt, result.speed);

                // Le vainqueur se tourne vers le public pour fêter
                if (mode !== 'podium') {
                    const celebrating = state.includes('is-winner') && f.since > 0.6;
                    f.model.rotation.y = turnToward(f.model.rotation.y, celebrating ? 0 : f.facing, 6, dt);
                }
                // Entrée du duel : les cowboys arrivent des côtés
                if (mode === 'duel') {
                    const k2 = b.phase === 'duelIntro' ? ease.out(span(phaseSince, 0.9, 2.5)) : 1;
                    f.model.position.x = (p === 0 ? -1 : 1) * THREE.MathUtils.lerp(5.5, GAP.duel, k2);
                }

                // Effets : impacts, flash rouge, étoiles, aura, gant géant
                const other = fighters[1 - p];
                const impact = (at, big = false) => {
                    if (f.since >= at && fire(f, `hit${at}`)) {
                        fx.burst(headOf(f).lerp(headOf(other), 0.3), { size: big ? 2.6 : 1.3 });
                        f.flash = 1;
                        shake = big ? 0.25 : 0.1;
                    }
                };
                if (mode === 'ring') {
                    if (state.includes('is-hit')) impact(0.16);
                    if (state.includes('is-countered')) impact(0.61);
                    if (state.includes('is-blasted') && !move) impact(0.02, true);
                }
                f.flash = Math.max(0, f.flash - dt * 4);
                f.model.userData.body.material.emissive.setRGB(f.flash * 0.9, f.flash * 0.1, f.flash * 0.1);
                const ko = state.includes('is-ko') || (state === 'is-shot' && f.since > 0.9);
                f.stars.forEach((star, i) => {
                    star.visible = ko && f.since > 0.9;
                    const a = t * 3 + (i / 3) * Math.PI * 2;
                    const head = f.model.localToWorld(new THREE.Vector3(0, 0.3, -1.0));
                    star.position.set(head.x + Math.cos(a) * 0.4, head.y + 0.25 + Math.sin(a * 2) * 0.05, head.z + Math.sin(a) * 0.4);
                });
                const charging = state.includes('is-charging');
                // Colonne d'aura seulement pour l'ancien coup géant ; les coups d'anime ont leurs propres effets
                f.aura.material.opacity = THREE.MathUtils.damp(f.aura.material.opacity, charging && !move ? 0.35 + Math.sin(t * 20) * 0.1 : 0, 8, k);
                f.aura.rotation.y += dt * 4;
                f.aura.scale.setScalar(1 + Math.sin(t * 12) * 0.05);
                if (charging && Math.random() < dt * 14) {
                    fx.burst(f.model.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 1.8, (Math.random() - 0.5) * 0.8)), { color: new THREE.Color(ps[p].gloves), size: 0.35, life: 0.45, texture: dotTexture() });
                }
                const front = p === 0 ? 0 : 1;
                f.gloveScale = THREE.MathUtils.damp(f.gloveScale, state.includes('is-megapunch') && !move ? 2.6 : 1, 14, k);
                f.model.userData.arms[front].scale.set(1, 1, 1); // le bras élastique reprend sa taille
                f.model.userData.arms[front].userData.glove.scale.set(f.gloveScale, f.gloveScale * 1.1, f.gloveScale * 0.95);

                // Duel : coup de feu (flash, lumière, fumée, trajectoire)
                const revolver = f.model.userData.revolver;
                if (revolver && (state === 'is-shooter' || state === 'is-missing') && f.since >= 0.08 && fire(f, 'shot')) {
                    const muzzle = revolver.userData.muzzle.getWorldPosition(new THREE.Vector3());
                    const dir = new THREE.Vector3(p === 0 ? 1 : -1, 0, 0);
                    fx.burst(muzzle, { color: 0xffd27a, size: 1.1, life: 0.16 });
                    fx.smoke(muzzle, dir);
                    const target = headOf(other).add(new THREE.Vector3(0, -0.4, 0));
                    if (state === 'is-missing') target.add(new THREE.Vector3(0, 1.1, -1.2));
                    fx.tracer(muzzle, target);
                    shake = 0.12;
                }
            });

            if (energy) {
                const w0 = b?.roundWinner ?? 0;
                updateEnergy(energy, {
                    move: anime ? move : null, stage, s: stageSince, t, dt, fx, fired: energyFired, p: w0,
                    winner: fighters[w0].model, loser: fighters[1 - w0].model,
                    kick: (force) => {
                        shake = Math.max(shake, force);
                        if (force >= 0.25) fighters[1 - w0].flash = 1;
                    },
                });
            }

            // Animations du décor
            if (mode === 'ring') {
                decor.flashes.forEach((flash, i) => {
                    if (flash.material.opacity <= 0.01 && Math.random() < dt * 0.6) {
                        flash.position.set(-7 + Math.random() * 14, 0.2 + Math.random() * 1.2, -4.3 - Math.floor(Math.random() * 3) * 0.9);
                        flash.material.opacity = 1;
                    }
                    flash.material.opacity = Math.max(0, flash.material.opacity - dt * (4 + i));
                });
            } else if (mode === 'duel') {
                const cycle = (t * 0.12) % 1;
                decor.weed.position.set(THREE.MathUtils.lerp(-12, 12, cycle), 0.35 + Math.abs(Math.sin(t * 3)) * 0.35, -2.4);
                decor.weed.rotation.z = -t * 4;
                const d = decor.dust.geometry.attributes.position;
                for (let i = 0; i < d.count; i++) {
                    d.setXYZ(i, ((i * 1.37 + t * (0.5 + (i % 5) * 0.12)) % 16) - 8, 0.1 + ((i * 0.53) % 1.6) + Math.sin(t + i) * 0.1, -3 + ((i * 0.71) % 5));
                }
                d.needsUpdate = true;
            } else {
                const dummy = new THREE.Object3D();
                decor.seeds.forEach((s, i) => {
                    s.y -= s.v * dt;
                    if (s.y < 0) s.y += 6;
                    dummy.position.set(s.x + Math.sin(t * 1.5 + s.phase) * 0.3, s.y, s.z);
                    dummy.rotation.set(t * s.spin, t * s.spin * 0.7, s.phase);
                    dummy.updateMatrix();
                    decor.confetti.setMatrixAt(i, dummy.matrix);
                });
                decor.confetti.instanceMatrix.needsUpdate = true;
                decor.beams.forEach((beam, i) => { beam.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.25; });
            }

            // Caméra : douce oscillation ; resserrée sur le duel, un peu de tremblement aux impacts
            let pos;
            let look;
            if (mode === 'ring') {
                const charge = b?.finisherStage === 'charge' && b.finisherMove !== 'genki' ? 1 : 0;
                const genki = b?.finisherMove === 'genki' && (b.finisherStage === 'charge' || b.finisherStage === 'blast') ? 1 : 0;
                const sway = Math.sin(t * 0.3) * 0.18;
                pos = new THREE.Vector3(Math.sin(sway) * 6.6 + (charge ? (b.roundWinner === 0 ? -0.8 : 0.8) : 0), 2.35 - charge * 0.3 + genki * 0.9, Math.cos(sway) * 6.6 - charge * 1.2 + genki * 1.2);
                look = new THREE.Vector3(charge ? (b.roundWinner === 0 ? -0.5 : 0.5) : 0, 1.0 + genki * 0.9, 0);
            } else if (mode === 'duel') {
                const tense = b && (b.phase === 'duel' || b.phase === 'duelPeek') ? 1 : 0;
                pos = new THREE.Vector3(Math.sin(t * 0.2) * 0.3, 1.5 - tense * 0.2, 8.2 - tense * 1.1);
                look = new THREE.Vector3(0, 1.15, 0);
            } else {
                const sway = Math.sin(t * 0.35) * 0.22;
                pos = new THREE.Vector3(Math.sin(sway) * 6.2, 2.6, Math.cos(sway) * 6.2);
                look = new THREE.Vector3(0, 1.3, 0);
            }
            if (!camPos.lengthSq()) camPos.copy(pos);
            camPos.lerp(pos, 1 - Math.exp(-3 * k));
            camera.position.copy(camPos);
            if (shake > 0) {
                camera.position.x += (Math.random() - 0.5) * shake;
                camera.position.y += (Math.random() - 0.5) * shake;
                shake = Math.max(0, shake - dt * 0.9);
            }
            camera.lookAt(look);
        });

        return () => {
            off();
            fx.clear();
            scene.remove(group);
            dispose(group);
            engine.dispose();
            worldRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- la scène est reconstruite si les joueurs ou le mode changent
    }, [mode, playersKey, winner]);

    return <div className={`battle3d mode-${mode}`} ref={mountRef} aria-hidden="true" />;
}
