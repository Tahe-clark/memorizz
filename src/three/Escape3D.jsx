import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createEngine } from './engine';
import { avatarModel, canvasTexture, dispose, dotTexture, labelSprite, mat, monsterModel, setMood, shadowy } from './models';
import { applyPose, ease, span, turnToward, walkPose } from './rig';

// Escape en vraie 3D (Three.js), comme dans la vidéo : la maison entière vue de
// haut et de biais, caméra fixe (elle ne zoome pas sur le héros). Le héros marche
// vraiment d'une pièce à l'autre : il se tourne dans la bonne direction, pousse la
// porte qui pivote sur ses gonds, la traverse ; le monstre fait pareil en défonçant
// les portes. Avant la poursuite, la caméra présente la maison : toi, la sortie,
// le monstre. Ce fichier n'est chargé que si la vue 3D est choisie (React.lazy).

const C = 2.4; // taille d'une pièce
const DOOR = 0.95; // largeur d'une porte
const DOOR_H = 1.2;
const WALL_H = 1.5;
const T = 0.14; // épaisseur des murs
const HERO_SCALE = 0.78;
const MONSTER_SCALE = 0.84;
const HERO_SPEED = 4.2; // unités par seconde
const MONSTER_SPEED = 2.9;
const ELEVATION = 0.98; // angle de la caméra (≈ 56°)

const cellPos = (house, cell) => new THREE.Vector3((cell % house.cols) * C, 0, Math.floor(cell / house.cols) * C);
const adjacent = (house, a, b) => {
    const [ax, ay] = [a % house.cols, Math.floor(a / house.cols)];
    const [bx, by] = [b % house.cols, Math.floor(b / house.cols)];
    return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};
const doorKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

function textures() {
    const planks = canvasTexture(256, 256, (c, w, h) => {
        const tones = ['#5a4030', '#4d3627', '#43301f'];
        for (let i = 0; i < 8; i++) {
            c.fillStyle = tones[i % 3];
            c.fillRect(i * 32, 0, 32, h);
            c.fillStyle = 'rgba(0,0,0,0.3)';
            c.fillRect(i * 32, 0, 2, h);
            for (let k = 0; k < 3; k++) c.fillRect(i * 32, (i * 97 + k * 83) % 256, 32, 2);
        }
        for (let k = 0; k < 26; k++) {
            c.fillStyle = `rgba(0,0,0,${0.08 + (k % 5) * 0.04})`;
            c.beginPath();
            c.arc((k * 53) % 256, (k * 89) % 256, 8 + (k % 7) * 4, 0, 7);
            c.fill();
        }
    });
    const wallpaper = canvasTexture(128, 128, (c, w, h) => {
        c.fillStyle = '#4a3c50';
        c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 16) {
            c.fillStyle = 'rgba(255,255,255,0.06)';
            c.fillRect(x, 0, 6, h);
        }
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(40,20,10,0.7)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
    });
    const wood = canvasTexture(64, 128, (c, w, h) => {
        c.fillStyle = '#6b4528';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(0,0,0,0.35)';
        c.lineWidth = 4;
        c.strokeRect(6, 6, w - 12, h / 2 - 9);
        c.strokeRect(6, h / 2 + 3, w - 12, h / 2 - 9);
        for (let y = 0; y < h; y += 7) {
            c.fillStyle = `rgba(0,0,0,${0.05 + (y % 3) * 0.03})`;
            c.fillRect(0, y, w, 1);
        }
    });
    return { planks, wallpaper, wood };
}

/** Une porte sur gonds : le battant pivote autour d'un de ses bords. */
function makeDoor(material, vertical) {
    const pivot = new THREE.Group();
    const geometry = vertical ? new THREE.BoxGeometry(0.07, DOOR_H, DOOR - 0.05) : new THREE.BoxGeometry(DOOR - 0.05, DOOR_H, 0.07);
    if (vertical) geometry.translate(0, DOOR_H / 2, (DOOR - 0.05) / 2 + 0.025);
    else geometry.translate((DOOR - 0.05) / 2 + 0.025, DOOR_H / 2, 0);
    const panel = new THREE.Mesh(geometry, material);
    pivot.add(panel);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0xd8b25a, { m: 0.8, r: 0.3 }));
    if (vertical) knob.position.set(0, 0.62, DOOR - 0.16);
    else knob.position.set(DOOR - 0.16, 0.62, 0);
    pivot.add(knob);
    return shadowy(pivot);
}

function buildHouse(house) {
    const group = new THREE.Group();
    const { planks, wallpaper, wood } = textures();
    const { cols, rows } = house;

    // Sol autour de la maison
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(cols * C + 30, rows * C + 30), mat(0x0d0a12, { r: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(((cols - 1) * C) / 2, -0.13, ((rows - 1) * C) / 2);
    ground.receiveShadow = true;
    group.add(ground);

    const floorMaterial = mat(0xffffff, { map: planks, r: 0.85 });
    for (let cell = 0; cell < cols * rows; cell++) {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(C, 0.12, C), floorMaterial);
        floor.position.copy(cellPos(house, cell)).setY(-0.06);
        floor.receiveShadow = true;
        group.add(floor);
    }
    const wallMaterial = mat(0xffffff, { map: wallpaper, r: 0.9 });
    const capMaterial = mat(0x1e1624, { r: 0.6 });
    const segment = (x1, z1, x2, z2, height = WALL_H) => {
        const length = Math.hypot(x2 - x1, z2 - z1);
        if (length < 0.01) return;
        const angle = -Math.atan2(z2 - z1, x2 - x1);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, T), wallMaterial);
        wall.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
        wall.rotation.y = angle;
        group.add(shadowy(wall));
        const cap = new THREE.Mesh(new THREE.BoxGeometry(length + T, 0.06, T + 0.04), capMaterial);
        cap.position.set((x1 + x2) / 2, height + 0.03, (z1 + z2) / 2);
        cap.rotation.y = angle;
        group.add(cap);
    };
    const x0 = -C / 2;
    const z0 = -C / 2;
    // Murs intérieurs, chacun avec une porte au milieu (toutes les portes s'ouvrent)
    const doors = new Map();
    const doorMaterial = () => mat(0xffffff, { map: wood, r: 0.7 });
    for (let r = 0; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
            const x = x0 + c * C;
            const z = z0 + r * C;
            segment(x, z, x, z + (C - DOOR) / 2);
            segment(x, z + (C + DOOR) / 2, x, z + C);
            const a = r * cols + c - 1;
            const material = doorMaterial();
            const pivot = makeDoor(material, true);
            pivot.position.set(x, 0, z + (C - DOOR) / 2);
            group.add(pivot);
            doors.set(doorKey(a, a + 1), { pivot, material, vertical: true, center: new THREE.Vector3(x, 0, z + C / 2), open: 0, target: 0, sign: 1, speed: 8 });
        }
    }
    for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const z = z0 + r * C;
            const x = x0 + c * C;
            segment(x, z, x + (C - DOOR) / 2, z);
            segment(x + (C + DOOR) / 2, z, x + C, z);
            const a = (r - 1) * cols + c;
            const material = doorMaterial();
            const pivot = makeDoor(material, false);
            pivot.position.set(x + (C - DOOR) / 2, 0, z);
            group.add(pivot);
            doors.set(doorKey(a, a + cols), { pivot, material, vertical: false, center: new THREE.Vector3(x + C / 2, 0, z), open: 0, target: 0, sign: 1, speed: 8 });
        }
    }
    // Murs extérieurs ; celui de devant est bas pour laisser voir les pièces
    segment(x0, z0, x0 + cols * C, z0);
    segment(x0, z0, x0, z0 + rows * C);
    segment(x0 + cols * C, z0, x0 + cols * C, z0 + rows * C);
    segment(x0, z0 + rows * C, x0 + cols * C, z0 + rows * C, 0.3);

    // La trappe de sortie : un halo vert, une trappe qui s'ouvre et des lucioles
    const exitPos = cellPos(house, house.exit);
    const exit = new THREE.Group();
    exit.position.copy(exitPos);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(C - 0.16, 0.02, C - 0.16), mat(0x2fa35a, { e: 0x2bff7a, ei: 0.7 }));
    glow.position.y = 0.01;
    exit.add(glow);
    const hole = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 1.1), mat(0x020a04, { e: 0x0a5a24, ei: 1.4 }));
    hole.position.y = 0.025;
    exit.add(hole);
    const lid = new THREE.Group();
    lid.position.set(0, 0.05, -0.55);
    const lidPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 1.1), mat(0x6b4a2b));
    lidPanel.position.z = 0.55;
    lid.add(lidPanel);
    [0, Math.PI / 2].forEach((a) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.1), mat(0x2b1d10));
        bar.rotation.y = a;
        bar.position.set(0, 0.02, 0.55);
        lid.add(bar);
    });
    exit.add(lid);
    group.add(shadowy(exit));
    const exitLight = new THREE.PointLight(0x2bff7a, 5, 4.5, 1.6);
    exitLight.position.copy(exitPos).setY(0.9);
    group.add(exitLight);
    const fireflyCount = 22;
    const fireflies = new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(fireflyCount * 3), 3)),
        new THREE.PointsMaterial({ size: 0.16, map: dotTexture(), color: 0x6bff9e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    fireflies.position.copy(exitPos);
    group.add(fireflies);

    // Ambiance : caisses et bougies dans quelques coins
    const candles = [];
    for (let cell = 0; cell < cols * rows; cell++) {
        if (cell === house.exit || cell === house.start) continue;
        const p = cellPos(house, cell);
        if ((cell * 7) % 3 === 0) {
            const size = 0.42 + ((cell * 13) % 3) * 0.08;
            const crate = new THREE.Mesh(new RoundedBoxGeometry(size, size, size, 2, 0.04), mat(0x5a4230));
            crate.position.set(p.x - C * 0.32, size / 2, p.z - C * 0.32);
            crate.rotation.y = cell * 0.7;
            group.add(shadowy(crate));
        } else if ((cell * 5) % 4 === 1) {
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), mat(0xeae0c8));
            candle.position.set(p.x + C * 0.34, 0.11, p.z - C * 0.34);
            group.add(candle);
            const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xffb04a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
            flame.position.set(p.x + C * 0.34, 0.3, p.z - C * 0.34);
            flame.scale.set(0.22, 0.32, 1);
            group.add(flame);
            candles.push(flame);
        }
    }
    return { group, doors, exitLight, lid, fireflies, candles, exitPos };
}

/** Un personnage qui suit une file de points de passage (centre → porte → centre). */
function makeMover(object, house, cell, speed) {
    object.position.copy(cellPos(house, cell));
    return { object, cell, queue: [], speed, heading: 0, stride: 0, amount: 0, moving: false, dir: new THREE.Vector3(0, 0, 1) };
}

function routeTo(mover, house, cell) {
    if (cell === mover.cell) return;
    if (!adjacent(house, mover.cell, cell)) {
        mover.queue = [];
        mover.object.position.copy(cellPos(house, cell));
    } else {
        const a = cellPos(house, mover.cell);
        const b = cellPos(house, cell);
        const door = a.clone().lerp(b, 0.5);
        mover.queue.push({ p: door, door: doorKey(mover.cell, cell) }, { p: b });
    }
    mover.cell = cell;
}

/** Avance un personnage le long de sa file ; plus vite s'il a du retard (réactivité). */
function stepMover(mover, dt, blocker) {
    const pos = mover.object.position;
    let budget = mover.speed * (mover.queue.length > 3 ? 1.9 : 1) * dt;
    let travelled = 0;
    while (budget > 0 && mover.queue.length) {
        const target = mover.queue[0].p;
        const to = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
        const distance = to.length();
        if (blocker && pos.distanceTo(blocker) < 0.95) break;
        if (distance <= budget) {
            pos.x = target.x;
            pos.z = target.z;
            budget -= distance;
            travelled += distance;
            mover.queue.shift();
        } else {
            to.normalize();
            pos.x += to.x * budget;
            pos.z += to.z * budget;
            travelled += budget;
            mover.dir.copy(to);
            budget = 0;
        }
    }
    mover.moving = travelled > 0.0001;
    mover.stride += travelled * 2.5;
    return travelled;
}

export default function Escape3D({ house, player, monster, calcs, phase, near, hero, onFail }) {
    const heroKey = JSON.stringify(hero);
    const mountRef = useRef(null);
    const engineRef = useRef(null);
    const worldRef = useRef(null);
    const stateRef = useRef({ phase, near, phaseAt: 0 });

    // Moteur 3D, lumières et boucle d'animation : créés une seule fois
    useEffect(() => {
        const mount = mountRef.current;
        let engine;
        try {
            engine = createEngine(mount, { background: 0x07050c, exposure: 1.35, bloom: [0.5, 0.55, 0.85], fov: 38, ratio: (w) => (w < 560 ? 0.9 : 0.62), maxVh: 0.6 });
        } catch {
            onFail?.();
            return undefined;
        }
        const { scene, camera } = engine;
        scene.fog = new THREE.FogExp2(0x07050c, 0.012);
        scene.add(new THREE.HemisphereLight(0x8a96d8, 0x1a1020, 1.5));
        const moon = new THREE.DirectionalLight(0x9aaaf0, 2.4);
        moon.position.set(6, 16, 4);
        moon.castShadow = true;
        moon.shadow.mapSize.set(2048, 2048);
        moon.shadow.bias = -0.0005;
        Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 60 });
        scene.add(moon, moon.target);
        const lantern = new THREE.PointLight(0xffa04a, 9, 6.5, 1.4);
        scene.add(lantern);
        engineRef.current = { ...engine, moon, lantern };

        const camPos = new THREE.Vector3(0, 14, 14);
        const camLook = new THREE.Vector3();
        const off = engine.onFrame((t, dt) => {
            const world = worldRef.current;
            if (!world) return;
            const st = stateRef.current;
            const pt = t - st.phaseAt; // temps écoulé dans la phase
            const { heroMover, beastMover, heroModel, beast } = world;
            const caught = st.phase === 'caught';
            const escaped = st.phase === 'escaped';

            // --- Déplacements ---
            stepMover(heroMover, dt, caught ? beast.position : null);
            stepMover(beastMover, dt, caught ? heroModel.position : null);

            // --- Le héros : orientation, marche, porte poussée ---
            const hu = heroMover;
            hu.amount = THREE.MathUtils.damp(hu.amount, hu.moving ? 1 : 0, 12, dt);
            const faceAngle = hu.moving ? Math.atan2(hu.dir.x, hu.dir.z) : (caught ? Math.atan2(beast.position.x - heroModel.position.x, beast.position.z - heroModel.position.z) : 0);
            hu.heading = turnToward(hu.heading, faceAngle, hu.moving ? 16 : 5, dt);
            heroModel.rotation.y = hu.heading;
            let pose;
            const nextDoor = hu.queue.find((w) => w.door);
            const pushing = nextDoor && world.doors.get(nextDoor.door)?.center.distanceTo(heroModel.position) < 1.05;
            if (caught && pt > 0.35) {
                pose = { rx: -1.45, y: 0.15, a0x: -2.6, a1x: -2.4, l0x: -0.5 };
            } else if (escaped && !hu.queue.length) {
                const jump = Math.abs(Math.sin(pt * 7));
                pose = pt < 1.2 ? { y: jump * 0.35, a0x: -2.9, a1x: -2.9, a0z: -0.4, a1z: 0.4 } : { y: -1.4 * ease.inOut(span(pt, 1.2, 1.9)), a0x: -2.9, a1x: -2.9 };
            } else if (hu.amount > 0.05) {
                pose = walkPose(hu.stride, hu.amount, pushing ? { a1x: -1.45, a0x: -1.2, tx: 0.2 } : {});
            } else {
                const breathe = Math.sin(t * 2.2);
                pose = st.near ? { a0x: -0.9, a1x: -0.9, tz: Math.sin(t * 30) * 0.03, y: breathe * 0.01 } : { y: (breathe + 1) * 0.012, tz: breathe * 0.015, a0z: -0.16 - breathe * 0.03, a1z: 0.16 + breathe * 0.03 };
            }
            applyPose(heroModel, pose, dt, 14);

            // --- Le monstre : démarche saccadée, cape qui flotte, tête qui tressaute ---
            const bm = beastMover;
            const bu = beast.userData;
            bm.amount = THREE.MathUtils.damp(bm.amount, bm.moving ? 1 : 0, 6, dt);
            const toHero = Math.atan2(heroModel.position.x - beast.position.x, heroModel.position.z - beast.position.z);
            // Au moment de la capture, il se tourne d'un coup vers sa proie
            bm.heading = turnToward(bm.heading, bm.moving && !caught ? Math.atan2(bm.dir.x, bm.dir.z) : toHero, caught ? 20 : bm.moving ? 9 : 3, dt);
            beast.rotation.y = bm.heading;
            const s = bm.stride * 0.8;
            const lurch = bm.amount;
            const roar = (st.phase === 'reveal' && pt > 1.5 && pt < 3) || caught || st.near === 1;
            const reach = caught || st.near === 1 ? 1 : 0;
            const k = Math.min(dt, 0.05);
            const dampTo = (obj, axis, value, lambda = 8) => { obj.rotation[axis] = THREE.MathUtils.damp(obj.rotation[axis], value, lambda, k); };
            bu.legs.forEach((leg, i) => dampTo(leg, 'x', Math.sin(s + i * Math.PI) * 0.55 * lurch, 12));
            bu.rig.position.y = Math.abs(Math.sin(s)) * 0.12 * lurch + Math.sin(t * 1.6) * 0.03;
            bu.rig.rotation.z = Math.sin(s) * 0.12 * lurch;
            // Il bondit sur sa proie
            bu.rig.position.z = THREE.MathUtils.damp(bu.rig.position.z, caught ? ease.out(span(pt, 0, 0.3)) * 0.55 : 0, 16, Math.min(dt, 0.05));
            dampTo(bu.torso, 'x', 0.38 + lurch * 0.18 + reach * 0.15 + Math.sin(t * 1.6) * 0.03);
            bu.arms.forEach(({ shoulder, elbow }, i) => {
                const swing = Math.sin(s + i * Math.PI) * 0.5 * lurch;
                const spread = (st.phase === 'reveal' && pt > 1.5 && pt < 3) || (caught && pt > 0.25);
                dampTo(shoulder, 'x', spread ? -2.4 : -reach * 1.35 + swing - 0.1, reach ? 10 : 6);
                dampTo(shoulder, 'z', (i ? 1 : -1) * (spread ? 0.9 : 0.18 + Math.sin(t * 2 + i) * 0.05), 6);
                dampTo(elbow, 'x', spread ? -0.2 : -0.35 - reach * 0.3 + Math.sin(t * 2.3 + i) * 0.08, 6);
            });
            // Tics nerveux de la tête
            if (t > (world.twitchAt ?? 0)) {
                world.twitch = (Math.random() - 0.5) * 0.9;
                world.twitchAt = t + 0.5 + Math.random() * 1.6;
            }
            dampTo(bu.head, 'z', world.twitch ?? 0, 22);
            dampTo(bu.head, 'y', Math.sin(t * 0.9) * 0.25, 4);
            dampTo(bu.jaw, 'x', roar ? 0.75 + Math.sin(t * 24) * 0.06 : 0.12 + Math.max(0, Math.sin(t * 1.3)) * 0.25, roar ? 14 : 5);
            bu.strips.forEach((strip, i) => {
                strip.rotation.x = strip.userData.base + 0.18 * lurch + Math.sin(t * 3.2 + i * 1.7) * (0.08 + 0.12 * lurch);
                strip.rotation.z = Math.sin(t * 2.1 + i) * 0.06;
            });
            bu.eyeMaterial.emissiveIntensity = 5 + Math.sin(t * 9) * 1.5 + (roar ? 4 : 0);
            bu.glow.intensity = 1.1 + (roar ? 1.6 : 0) + (caught ? 5 : 0) + Math.sin(t * 11) * 0.25;
            bu.glow.distance = caught ? 4.5 : 1.6;
            const mist = bu.mist.geometry.attributes.position;
            bu.mist.userData.seeds.forEach((seed, i) => {
                const a = seed.a + t * 0.25 * seed.s;
                const y = (seed.h + t * 0.12 * seed.s) % 1;
                mist.setXYZ(i, Math.cos(a) * seed.r * (1 + y * 0.3), y * 0.7, Math.sin(a) * seed.r * (1 + y * 0.3));
            });
            mist.needsUpdate = true;

            // --- Portes : elles s'ouvrent devant celui qui passe, puis se referment ---
            world.doors.forEach((door) => {
                let target = 0;
                let speed = 3;
                [[heroModel, heroMover, 9], [beast, beastMover, 18]].forEach(([model, mover, quick]) => {
                    if (door.center.distanceTo(model.position) < 1.15) {
                        const way = mover.queue.length ? mover.dir : new THREE.Vector3().subVectors(model.position, door.center);
                        if (door.open < 0.25) door.sign = door.vertical ? Math.sign(way.x || 1) : -Math.sign(way.z || 1);
                        target = 1.65;
                        speed = quick;
                    }
                });
                door.target = target;
                door.open = THREE.MathUtils.damp(door.open, target, speed, k);
                door.pivot.rotation.y = door.open * door.sign;
                const glowColor = door.offered ? (door.danger ? 0x7a0a0a : 0x6a3c08) : 0x000000;
                door.material.emissive.setHex(glowColor);
                door.material.emissiveIntensity = door.offered ? 0.7 + Math.sin(t * 5) * 0.3 : 0;
            });

            // --- Sortie : la trappe s'ouvre quand tu arrives, lucioles qui montent ---
            const lidOpen = escaped ? 1 : 0;
            world.lid.rotation.x = THREE.MathUtils.damp(world.lid.rotation.x, -lidOpen * 1.9, 6, k);
            world.exitLight.intensity = escaped ? 10 + Math.sin(t * 8) * 3 : 4 + Math.sin(t * 2) * 1.2;
            const ff = world.fireflies.geometry.attributes.position;
            for (let i = 0; i < ff.count; i++) {
                const y = ((i * 0.37 + t * (0.15 + (i % 4) * 0.05)) % 1);
                ff.setXYZ(i, Math.sin(i * 2.4 + t * 0.7) * 0.8, y * 1.8, Math.cos(i * 1.7 + t * 0.6) * 0.8);
            }
            ff.needsUpdate = true;
            world.candles.forEach((flame, i) => { flame.scale.y = 0.3 + Math.sin(t * 13 + i * 3) * 0.04; });

            // --- Lanterne du héros ---
            const lantern = engineRef.current.lantern;
            lantern.position.set(heroModel.position.x, 2.9, heroModel.position.z + 0.3);
            lantern.intensity = 6 + Math.sin(t * 13) * 0.7 + Math.sin(t * 7.3) * 0.5;

            // --- Étiquettes : flottent doucement, apparaissent en grossissant ---
            [...world.labels, ...world.tags].forEach((label, i) => {
                const grow = ease.back(Math.min(1, Math.max(0, (t - label.userData.born) / 0.35)));
                label.scale.set(label.userData.w * grow, label.userData.w * 0.4 * grow, 1);
                label.position.y = label.userData.y + Math.sin(t * 2.2 + i) * 0.06;
            });

            // --- Caméra fixe sur toute la maison, comme dans la vidéo ---
            const vfov = THREE.MathUtils.degToRad(camera.fov);
            const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
            const width = house.cols * C + 1.4;
            const depth = house.rows * C + 1.4;
            const distance = Math.max(width / 2 / Math.tan(hfov / 2), (depth / 2 * Math.sin(ELEVATION) + 0.6) / Math.tan(vfov / 2)) + depth * 0.12;
            let azimuth = Math.sin(t * 0.22) * 0.035;
            let elevation = ELEVATION;
            let dist = distance;
            let lambda = 3;
            if (st.phase === 'memorize') {
                azimuth = Math.sin(t * 0.25) * 0.3;
                dist = distance * 1.05;
            } else if (st.phase === 'reveal') {
                // Présentation : la caméra tourne autour de la maison puis se pose
                const r = ease.inOut(span(pt, 0, 2.6));
                azimuth = THREE.MathUtils.lerp(-0.85, 0, r);
                elevation = THREE.MathUtils.lerp(1.28, ELEVATION, r);
                dist = distance * THREE.MathUtils.lerp(1.2, 1, r);
                lambda = 7;
            }
            let center = world.center;
            const target = new THREE.Vector3(
                center.x + Math.sin(azimuth) * Math.cos(elevation) * dist,
                Math.sin(elevation) * dist,
                center.z + Math.cos(azimuth) * Math.cos(elevation) * dist,
            );
            if (caught && pt > 0.1) {
                // Capture en 3D : la caméra fonce sur le visage du monstre qui se jette sur toi
                const head = bu.head.getWorldPosition(new THREE.Vector3());
                const angle = toHero + 0.5; // face au monstre, légèrement de côté
                target.set(head.x + Math.sin(angle) * 2.5, head.y + 0.45, head.z + Math.cos(angle) * 2.5);
                center = head;
                lambda = 9;
            }
            camPos.x = THREE.MathUtils.damp(camPos.x, target.x, lambda, k);
            camPos.y = THREE.MathUtils.damp(camPos.y, target.y, lambda, k);
            camPos.z = THREE.MathUtils.damp(camPos.z, target.z, lambda, k);
            camLook.lerp(center, 1 - Math.exp(-lambda * k));
            camera.position.copy(camPos);
            if ((st.near && st.phase === 'play') || (caught && pt < 1.1)) {
                const shake = caught ? 0.06 * (1 - pt / 1.1) + 0.015 : st.near === 1 ? 0.045 : 0.02;
                camera.position.x += Math.sin(t * 47) * shake;
                camera.position.y += Math.cos(t * 39) * shake;
            }
            camera.lookAt(camLook);
        });

        return () => {
            off();
            if (worldRef.current) {
                engine.scene.remove(worldRef.current.root);
                dispose(worldRef.current.root);
                worldRef.current = null;
            }
            engine.dispose();
            engineRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- le moteur n'est créé qu'une fois
    }, []);

    // Une nouvelle maison à chaque manche
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return undefined;
        const root = new THREE.Group();
        const built = buildHouse(house);
        root.add(built.group);
        const heroModel = avatarModel(hero);
        heroModel.scale.setScalar(HERO_SCALE);
        root.add(heroModel);
        const beast = monsterModel();
        beast.scale.setScalar(MONSTER_SCALE);
        root.add(beast);
        engine.scene.add(root);
        const center = new THREE.Vector3(((house.cols - 1) * C) / 2, 0.3, ((house.rows - 1) * C) / 2);
        engine.moon.target.position.copy(center);
        const heroMover = makeMover(heroModel, house, house.start, HERO_SPEED);
        const beastMover = makeMover(beast, house, house.monster, MONSTER_SPEED);
        worldRef.current = { root, ...built, heroModel, beast, heroMover, beastMover, labels: [], tags: [], center };
        return () => {
            engine.scene.remove(root);
            dispose(root);
            worldRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reconstruit seulement quand la maison change
    }, [house, heroKey]);

    // Chaque changement d'état : trajets, expression, portes proposées, étiquettes
    useEffect(() => {
        const engine = engineRef.current;
        const world = worldRef.current;
        if (!engine || !world) return;
        const now = engine.clock.elapsedTime;
        if (stateRef.current.phase !== phase) stateRef.current.phaseAt = now;
        stateRef.current.phase = phase;
        stateRef.current.near = near;
        routeTo(world.heroMover, house, player);
        routeTo(world.beastMover, house, monster);
        setMood(world.heroModel, phase === 'caught' ? 'ko' : phase === 'escaped' ? 'happy' : near ? 'worried' : 'angry');

        // Les portes proposées luisent (en rouge si le monstre est derrière)
        const offered = phase === 'play' ? calcs : [];
        world.doors.forEach((door, key) => {
            const calc = offered.find((c) => doorKey(player, c.cell) === key);
            door.offered = Boolean(calc);
            door.danger = calc?.cell === monster;
        });

        const clear = (list) => list.forEach((label) => {
            world.root.remove(label);
            dispose(label);
        });
        // Calcul affiché au-dessus de chaque pièce proposée
        clear(world.labels);
        world.labels = offered.map((calc) => {
            const label = labelSprite(`${calc.item} ${calc.op === '+' ? '+' : '−'} ${calc.value}`, { width: 2.0 });
            label.position.copy(cellPos(house, calc.cell));
            label.userData = { born: now, w: 2.0, y: 2.0 };
            world.root.add(label);
            return label;
        });
        // Présentation de la maison : « Toi », « Sortie », « Monstre »
        const presenting = phase === 'reveal' || phase === 'countdown';
        if (presenting && !world.tags.length) {
            const tags = [
                [house.start, 'TOI', '#ffd23f', '#1b1420', 0.15],
                [house.exit, 'SORTIE', '#2bd46a', '#06240f', 0.75],
                [monster, 'MONSTRE', '#e5383b', '#ffffff', 1.4],
            ];
            world.tags = tags.map(([cell, text, bg, fg, delay]) => {
                const tag = labelSprite(text, { bg, fg, width: 1.9, font: 50 });
                tag.position.copy(cellPos(house, cell));
                tag.userData = { born: now + delay, w: 1.9, y: 2.6 };
                world.root.add(tag);
                return tag;
            });
        } else if (!presenting && world.tags.length) {
            clear(world.tags);
            world.tags = [];
        }
    }, [house, player, monster, calcs, phase, near]);

    return <div className="esc-canvas" ref={mountRef} />;
}
