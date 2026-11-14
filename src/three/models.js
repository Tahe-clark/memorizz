import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Modèles 3D construits en code (aucun fichier externe) : les avatars de Memorizz
// articulés (jambes, bras, torse) pour marcher, boxer et tirer, le monstre d'Escape
// et les étiquettes. Chaque modèle expose ses articulations dans userData, et
// rig.js les anime.

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: o.r ?? 0.75,
    metalness: o.m ?? 0,
    emissive: o.e ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    map: o.map ?? null,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
});

export function shadowy(object, receive = true) {
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = receive;
        }
    });
    return object;
}

export function canvasTexture(w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
}

export function dispose(object) {
    object.traverse((child) => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((m) => {
            m?.map?.dispose();
            m?.dispose();
        });
    });
}

/** Petit point lumineux flou (brume, étincelles, poussière). */
let softDot = null;
export function dotTexture() {
    if (!softDot) {
        softDot = canvasTexture(64, 64, (c, w) => {
            const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, w, w);
        });
    }
    return softDot;
}

// Dimensions de chaque avatar : largeur, hauteur, profondeur du « boîtier ».
const BODIES = {
    console: [0.95, 1.3, 0.62],
    tower: [0.8, 1.45, 0.8],
    tv: [1.15, 1.0, 0.8],
    radio: [1.2, 0.95, 0.55],
};

const LEG = 0.4;

function accessoryModel(kind, w, h, d) {
    const group = new THREE.Group();
    if (kind === 'crown') {
        const gold = mat(0xf5c542, { r: 0.25, m: 0.7 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.16, 20, 1, true), gold);
        band.material.side = THREE.DoubleSide;
        band.position.y = 0.08;
        group.add(band);
        for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), gold);
            const a = (i / 5) * Math.PI * 2;
            spike.position.set(Math.sin(a) * 0.28, 0.24, Math.cos(a) * 0.28);
            group.add(spike);
        }
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat(0xe5484d, { e: 0x801010 }));
        gem.position.set(0, 0.09, 0.3);
        group.add(gem);
    } else if (kind === 'cap') {
        const cloth = mat(0xe5484d, { r: 0.6 });
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), cloth);
        dome.scale.y = 0.7;
        group.add(dome);
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20, 1, false, -Math.PI / 2, Math.PI), cloth);
        visor.position.set(0, 0.01, 0.18);
        group.add(visor);
    } else if (kind === 'bow') {
        const pink = mat(0xff6fa8, { r: 0.5 });
        [-1, 1].forEach((side) => {
            const loop = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 12), pink);
            loop.rotation.z = side * Math.PI / 2;
            loop.position.set(side * 0.14, 0.1, 0);
            group.add(loop);
        });
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), pink);
        knot.position.y = 0.1;
        group.add(knot);
        group.position.x = w * 0.25;
    } else if (kind === 'cowboy') {
        const leather = mat(0x7a4a24, { r: 0.8 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 28), leather);
        brim.scale.z = 0.8;
        brim.position.y = 0.03;
        group.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.33, 0.34, 20), leather);
        crown.position.y = 0.2;
        group.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.335, 0.06, 20), mat(0x2a1a0e));
        band.position.y = 0.08;
        group.add(band);
        group.rotation.x = -0.12;
    } else if (kind === 'headphones') {
        const dark = mat(0x22252e, { r: 0.4 });
        const band = new THREE.Mesh(new THREE.TorusGeometry(w * 0.5, 0.05, 10, 32, Math.PI), dark);
        band.position.y = -0.05;
        group.add(band);
        [-1, 1].forEach((side) => {
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), mat(0xff4f86, { r: 0.35 }));
            cup.rotation.z = Math.PI / 2;
            cup.position.set(side * (w * 0.5 + 0.02), -0.12, 0);
            group.add(cup);
        });
    } else if (kind === 'wizard') {
        const cloth = mat(0x4b3be8, { r: 0.6 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 28), cloth);
        group.add(brim);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 24), cloth);
        cone.position.set(0, 0.44, -0.04);
        cone.rotation.x = -0.18;
        group.add(cone);
        for (let i = 0; i < 4; i++) {
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat(0xffd23f, { e: 0x806010 }));
            star.position.set(Math.sin(i * 1.7) * 0.2, 0.15 + i * 0.13, 0.22 - i * 0.05);
            group.add(star);
        }
    } else if (kind === 'halo') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 10, 36), mat(0xffe08a, { e: 0xffc21a, ei: 1.2, r: 0.3, m: 0.4 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.32;
        ring.userData.float = true;
        group.add(ring);
    } else if (kind === 'horns') {
        const red = mat(0xe5383b, { r: 0.45 });
        [-1, 1].forEach((side) => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 12), red);
            horn.position.set(side * w * 0.3, 0.12, 0);
            horn.rotation.z = -side * 0.35;
            group.add(horn);
        });
    } else if (kind === 'headband') {
        const red = mat(0xe5383b, { r: 0.6 });
        const band = new THREE.Mesh(new RoundedBoxGeometry(w + 0.06, 0.13, d + 0.06, 2, 0.04), red);
        band.position.y = -0.2;
        group.add(band);
        const plate = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.1, 0.03, 2, 0.02), mat(0xc7ccd8, { m: 0.8, r: 0.3 }));
        plate.position.set(0, -0.2, d / 2 + 0.05);
        group.add(plate);
        [-0.15, 0.15].forEach((tilt) => {
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.02), red);
            tail.position.set(tilt * 0.6, -0.4, -d / 2 - 0.06);
            tail.rotation.set(0.5, 0, tilt * 2);
            group.add(tail);
        });
    } else if (kind === 'beanie') {
        const knit = mat(0x2fd1c5, { r: 0.9 });
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), knit);
        dome.scale.set(w * 1.15, 0.85, d * 1.6);
        dome.position.y = -0.06;
        group.add(dome);
        const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * w * 1.15, 0.4 * w * 1.15, 0.12, 24), mat(0x1fa89e, { r: 0.9 }));
        fold.scale.z = (d * 1.6) / (w * 1.15);
        fold.position.y = -0.04;
        group.add(fold);
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat(0xffffff, { r: 1 }));
        pom.position.y = 0.3;
        group.add(pom);
    } else if (kind === 'party') {
        const tex = canvasTexture(64, 64, (c, cw, ch) => {
            for (let i = 0; i < 8; i++) {
                c.fillStyle = i % 2 ? '#ffd23f' : '#ff4f86';
                c.fillRect(0, (i * ch) / 8, cw, ch / 8);
            }
        });
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 24), mat(0xffffff, { map: tex, r: 0.6 }));
        cone.position.y = 0.27;
        cone.rotation.z = 0.15;
        group.add(cone);
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(0x46c8ff));
        pom.position.set(-0.08, 0.56, 0);
        group.add(pom);
    } else if (kind === 'tophat') {
        const black = mat(0x14151f, { r: 0.35 });
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 28), black);
        group.add(brim);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 24), black);
        crown.position.y = 0.27;
        group.add(crown);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.08, 24), mat(0xe5383b));
        band.position.y = 0.08;
        group.add(band);
    }
    group.position.y += h;
    if (kind === 'shades') {
        const black = mat(0x0c0c10, { r: 0.15, m: 0.5 });
        [-1, 1].forEach((side) => {
            const lens = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.13, 0.04, 2, 0.03), black);
            lens.position.set(side * w * 0.16, 0, 0);
            group.add(lens);
        });
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, 0.03, 0.03), black);
        group.add(bridge);
        group.position.set(0, h * 0.68, d / 2 + 0.08);
    }
    return group;
}

function revolverModel() {
    const gun = new THREE.Group();
    const steel = mat(0x4a4f5a, { r: 0.3, m: 0.8 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), steel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.24;
    gun.add(barrel);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12), steel);
    drum.rotation.x = Math.PI / 2;
    drum.position.z = 0.04;
    gun.add(drum);
    const grip = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.2, 0.1, 2, 0.02), mat(0x6b3d1d));
    grip.position.set(0, -0.11, -0.04);
    grip.rotation.x = -0.35;
    gun.add(grip);
    const muzzle = new THREE.Object3D();
    muzzle.position.z = 0.47;
    gun.add(muzzle);
    gun.userData.muzzle = muzzle;
    return gun;
}

/** Objets portés dans le dos (casier) : katana, cape, ailes, jetpack, sac à dos. */
function backModel(kind, w, h, d) {
    const group = new THREE.Group();
    group.position.set(0, h * 0.55, -d / 2 - 0.04);
    if (kind === 'katana') {
        const sword = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.15, 0.015), mat(0xe6ecf2, { m: 0.9, r: 0.18 }));
        blade.position.y = 0.62;
        sword.add(blade);
        const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 16), mat(0xc9a227, { m: 0.8, r: 0.3 }));
        guard.position.y = 0.04;
        sword.add(guard);
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), mat(0x7a1f3d, { r: 0.7 }));
        grip.position.y = -0.14;
        sword.add(grip);
        const sheath = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.04), mat(0x14151f, { r: 0.4 }));
        sheath.position.set(0, 0.6, -0.01);
        sword.add(sheath);
        sword.rotation.z = 0.75;
        sword.position.set(-0.05, -0.15, -0.02);
        group.add(sword);
    } else if (kind === 'cape') {
        const geometry = new THREE.PlaneGeometry(w * 1.05, h * 0.95 + 0.35, 6, 8);
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            pos.setZ(i, -Math.pow((h * 0.5 - y) / (h + 0.4), 2) * 0.35 - Math.cos(pos.getX(i) * 3) * 0.04);
        }
        geometry.computeVertexNormals();
        const cape = new THREE.Mesh(geometry, mat(0xe5383b, { r: 0.7, side: THREE.DoubleSide }));
        cape.position.set(0, -h * 0.42, -0.02);
        group.add(cape);
        group.userData.cape = cape;
    } else if (kind === 'wings') {
        const white = mat(0xffffff, { r: 0.6 });
        [-1, 1].forEach((side) => {
            const wing = new THREE.Group();
            for (let k = 0; k < 3; k++) {
                const feather = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), white);
                feather.scale.set(1.2 - k * 0.25, 0.32, 0.12);
                feather.position.set(side * (0.25 + k * 0.08), 0.12 - k * 0.16, 0);
                feather.rotation.z = side * (0.4 + k * 0.15);
                wing.add(feather);
            }
            wing.position.x = side * 0.1;
            wing.rotation.y = side * -0.35;
            wing.userData.side = side;
            group.add(wing);
        });
        group.userData.wings = group.children;
    } else if (kind === 'jetpack') {
        const steel = mat(0xc7ccd8, { m: 0.75, r: 0.3 });
        [-1, 1].forEach((side) => {
            const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.45, 6, 14), steel);
            tank.position.set(side * 0.15, 0, -0.08);
            group.add(tank);
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 12), mat(0xff9a3a, { e: 0xff6a1a, ei: 2, transparent: true, opacity: 0.9 }));
            flame.rotation.x = Math.PI;
            flame.position.set(side * 0.15, -0.45, -0.08);
            group.add(flame);
        });
        const plate = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.4, 0.06, 2, 0.03), mat(0x2b2f3a));
        plate.position.z = 0.02;
        group.add(plate);
    } else if (kind === 'backpack') {
        const bag = new THREE.Mesh(new RoundedBoxGeometry(w * 0.7, h * 0.55, 0.28, 3, 0.08), mat(0x8b7bff, { r: 0.8 }));
        bag.position.z = -0.12;
        group.add(bag);
        const pocket = new THREE.Mesh(new RoundedBoxGeometry(w * 0.5, h * 0.22, 0.08, 2, 0.04), mat(0x6b5ce0, { r: 0.8 }));
        pocket.position.set(0, -h * 0.1, -0.29);
        group.add(pocket);
    }
    return group;
}

/**
 * Un avatar de Memorizz en volumes et articulé :
 * rig (tout le corps) → hips → torse (boîtier, visage, accessoire) + épaules → bras → gant,
 * et deux jambes pivotant aux hanches. Il regarde vers +z.
 */
export function avatarModel(player, mood = 'angry', { accessory = player.accessory, gun = false, gunArm = 1 } = {}) {
    const root = new THREE.Group();
    const rig = new THREE.Group();
    root.add(rig);
    const [w, h, d] = BODIES[player.avatar] ?? BODIES.console;
    const ink = mat(0x15151c, { r: 0.4 });
    const torso = new THREE.Group();
    torso.position.y = LEG;
    rig.add(torso);
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, 0.12), mat(player.color, { r: 0.55 }));
    body.position.y = h / 2;
    torso.add(body);

    // Le visage : un écran clair, deux yeux (qui deviennent des croix au K.O.) et une bouche
    const faceY = h * (player.avatar === 'radio' ? 0.72 : 0.68);
    const face = new THREE.Mesh(new RoundedBoxGeometry(w * 0.72, h * 0.36, 0.06, 2, 0.04), mat(0xf6f3e8, { r: 0.3 }));
    face.position.set(0, faceY, d / 2 + 0.01);
    torso.add(face);
    const eyes = [-1, 1].map((side) => {
        const eye = new THREE.Group();
        const a = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.03), ink);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.03), ink);
        eye.add(a, b);
        eye.position.set(side * w * 0.16, faceY + 0.03, d / 2 + 0.05);
        torso.add(eye);
        return eye;
    });
    const mouthFlat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.03), ink);
    mouthFlat.position.set(0, faceY - h * 0.1, d / 2 + 0.05);
    const mouthSmile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 6, 16, Math.PI), ink);
    mouthSmile.rotation.z = Math.PI;
    mouthSmile.position.set(0, faceY - h * 0.06, d / 2 + 0.05);
    torso.add(mouthFlat, mouthSmile);

    // Détails selon l'avatar
    if (player.avatar === 'console') {
        [[0.24, 0.07], [0.07, 0.24]].forEach(([a, b]) => {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(a, b, 0.05), ink);
            bar.position.set(-w * 0.22, h * 0.24, d / 2 + 0.02);
            torso.add(bar);
        });
        [[0.2, 0.28], [0.32, 0.2]].forEach(([x, y]) => {
            const button = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), mat(0xe5484d));
            button.rotation.x = Math.PI / 2;
            button.position.set(x * w, h * y, d / 2 + 0.02);
            torso.add(button);
        });
    } else if (player.avatar === 'tower') {
        for (let i = 0; i < 3; i++) {
            const slot = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.05, 0.04), ink);
            slot.position.set(0, h * (0.14 + i * 0.1), d / 2 + 0.01);
            torso.add(slot);
        }
    } else if (player.avatar === 'tv') {
        [-1, 1].forEach((side) => {
            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), ink);
            antenna.position.set(side * 0.18, h + 0.22, 0);
            antenna.rotation.z = -side * 0.5;
            torso.add(antenna);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0xe5484d));
            tip.position.set(side * 0.3, h + 0.44, 0);
            torso.add(tip);
        });
    } else {
        const speaker = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.18, w * 0.18, 0.05, 24), ink);
        speaker.rotation.x = Math.PI / 2;
        speaker.position.set(w * 0.24, h * 0.26, d / 2 + 0.02);
        torso.add(speaker);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(w * 0.3, 0.035, 8, 24, Math.PI), ink);
        handle.position.set(0, h, 0);
        torso.add(handle);
    }
    if (accessory && accessory !== 'none') torso.add(accessoryModel(accessory, w, h, d));
    if (player.back && player.back !== 'none') torso.add(backModel(player.back, w, h, d));

    // Bras : une épaule qui pivote, un bras et un gant au bout. Bras « 0 » à gauche (x < 0).
    const gloveMaterial = mat(player.gloves, { r: 0.35 });
    const arms = [-1, 1].map((side) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * (w / 2 + 0.05), h * 0.5, 0);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 8), ink);
        arm.position.y = -0.17;
        shoulder.add(arm);
        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), gloveMaterial);
        glove.scale.set(1, 1.1, 0.95);
        glove.position.y = -0.4;
        shoulder.add(glove);
        shoulder.userData.glove = glove;
        torso.add(shoulder);
        return shoulder;
    });
    let revolver = null;
    if (gun) {
        revolver = revolverModel();
        // Tenu dans un gant, canon dans l'axe du bras
        revolver.position.set(0, -0.48, 0.02);
        revolver.rotation.x = Math.PI / 2;
        arms[gunArm].add(revolver);
    }

    // Jambes : pivot à la hanche, pied au bout
    const legs = [-1, 1].map((side) => {
        const hip = new THREE.Group();
        hip.position.set(side * w * 0.22, LEG, 0);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, LEG, 10), ink);
        leg.position.y = -LEG / 2;
        hip.add(leg);
        const foot = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.09, 0.32, 2, 0.04), ink);
        foot.position.set(0, -LEG + 0.045, 0.06);
        hip.add(foot);
        rig.add(hip);
        return hip;
    });

    root.userData = { rig, torso, arms, legs, eyes, mouthFlat, mouthSmile, body, revolver, height: LEG + h, width: w, depth: d };
    setMood(root, mood);
    return shadowy(root);
}

/** Expression du visage : yeux et bouche. */
export function setMood(avatar, mood) {
    const { eyes, mouthFlat, mouthSmile } = avatar.userData;
    if (!eyes || avatar.userData.mood === mood) return;
    avatar.userData.mood = mood;
    const tilt = { angry: 0.35, worried: -0.35, hurt: -0.5, sad: -0.3, happy: 0, ko: 0 }[mood] ?? 0;
    eyes.forEach((eye, i) => {
        const [a, b] = eye.children;
        if (mood === 'ko') {
            a.rotation.z = 0.78;
            b.rotation.z = -0.78;
            a.scale.y = 0.6;
            b.visible = true;
        } else {
            a.rotation.z = i ? tilt : -tilt;
            a.scale.y = mood === 'happy' ? 0.45 : 1;
            b.visible = false;
        }
    });
    mouthSmile.visible = mood === 'happy' || mood === 'sad';
    mouthSmile.rotation.z = mood === 'sad' ? 0 : Math.PI;
    mouthFlat.visible = !mouthSmile.visible;
    mouthFlat.scale.x = { angry: 1, worried: 0.6, hurt: 0.8, ko: 0.9 }[mood] ?? 1;
    mouthFlat.rotation.z = mood === 'hurt' ? 0.25 : 0;
}

/**
 * Le monstre : grande créature décharnée et voûtée, crâne pâle aux orbites creuses
 * où brillent deux points rouges, mâchoire qui s'ouvre, cornes, côtes saillantes,
 * cape en lambeaux, bras interminables à griffes et brume rouge à ses pieds.
 */
export function monsterModel() {
    const root = new THREE.Group();
    const rig = new THREE.Group();
    root.add(rig);
    const skin = mat(0x241c2a, { r: 0.85 });
    const bone = mat(0xb9b09a, { r: 0.7 });
    const darkBone = mat(0x6d6555, { r: 0.8 });
    const cloth = mat(0x0d0a10, { r: 1, side: THREE.DoubleSide });

    // Jambes squelettiques
    const legs = [-1, 1].map((side) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.2, 1.0, 0);
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.0, 8), skin);
        thigh.position.y = -0.5;
        hip.add(thigh);
        for (let k = -1; k <= 1; k++) {
            const toe = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 6), darkBone);
            toe.rotation.x = Math.PI / 2;
            toe.position.set(k * 0.06, -0.98, 0.12);
            hip.add(toe);
        }
        rig.add(hip);
        return hip;
    });

    // Torse décharné, penché en avant
    const torso = new THREE.Group();
    torso.position.y = 1.0;
    torso.rotation.x = 0.38;
    rig.add(torso);
    const profile = [[0.0, 0], [0.2, 0.02], [0.17, 0.3], [0.22, 0.6], [0.36, 0.95], [0.3, 1.1], [0.1, 1.18], [0, 1.2]].map(([x, y]) => new THREE.Vector2(x, y));
    const chest = new THREE.Mesh(new THREE.LatheGeometry(profile, 16), skin);
    chest.scale.z = 0.7;
    torso.add(chest);
    // Côtes qui saillent
    for (let i = 0; i < 5; i++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.025, 0.018, 5, 14, Math.PI), bone);
        rib.rotation.set(Math.PI / 2 + 0.25, 0, 0);
        rib.scale.set(1, 0.75, 1);
        rib.position.set(0, 0.95 - i * 0.12, 0.02);
        torso.add(rib);
    }
    // Colonne vertébrale qui ressort dans le dos
    for (let i = 0; i < 6; i++) {
        const vertebra = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), darkBone);
        vertebra.rotation.x = -Math.PI / 2;
        vertebra.position.set(0, 0.35 + i * 0.13, -0.2 - Math.sin(i / 5 * Math.PI) * 0.04);
        torso.add(vertebra);
    }

    // Cape en lambeaux qui flotte (chaque bande pivote à l'épaule)
    const strips = [];
    for (let i = 0; i < 13; i++) {
        const a = -Math.PI / 2 + 0.6 + (i / 12) * (Math.PI * 2 - 1.2); // tout autour, sauf devant (a = -π/2)
        const length = 1.15 + ((i * 37) % 7) * 0.08;
        const pivot = new THREE.Group();
        pivot.position.set(Math.cos(a) * 0.33, 1.08, -Math.sin(a) * 0.26);
        pivot.rotation.order = 'YXZ'; // le battement (x) se fait dans l'axe de la bande
        pivot.rotation.y = -a + Math.PI / 2;
        const geometry = new THREE.PlaneGeometry(0.26, length, 1, 4);
        geometry.translate(0, -length / 2, 0);
        // Bas déchiqueté
        const pos = geometry.attributes.position;
        for (let v = 0; v < pos.count; v++) {
            if (pos.getY(v) < -length + 0.01) pos.setY(v, pos.getY(v) + ((v * 13) % 5) * 0.06);
        }
        const strip = new THREE.Mesh(geometry, cloth);
        pivot.add(strip);
        pivot.userData.base = 0.12 + (i % 3) * 0.05;
        torso.add(pivot);
        strips.push(pivot);
    }

    // Cou et crâne
    const neck = new THREE.Group();
    neck.position.set(0, 1.18, 0.05);
    torso.add(neck);
    const neckBone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8), skin);
    neckBone.position.y = 0.12;
    neckBone.rotation.x = -0.5;
    neck.add(neckBone);
    const head = new THREE.Group();
    head.position.set(0, 0.28, 0.12);
    head.rotation.x = -0.45; // relève la tête vers sa proie
    neck.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), bone);
    skull.scale.set(0.85, 1.15, 1);
    skull.position.y = 0.12;
    head.add(skull);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), bone);
    cheek.scale.set(1, 0.7, 1.05);
    cheek.position.set(0, -0.06, 0.08);
    head.add(cheek);
    // Orbites creuses et points rouges au fond
    const socket = mat(0x050304, { r: 1 });
    const eyeMaterial = mat(0xff2020, { e: 0xff1010, ei: 5 });
    [-1, 1].forEach((side) => {
        const hole = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), socket);
        hole.scale.set(1.1, 0.85, 0.6);
        hole.rotation.z = side * 0.35;
        hole.position.set(side * 0.11, 0.12, 0.25);
        head.add(hole);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), eyeMaterial);
        eye.position.set(side * 0.11, 0.115, 0.29);
        head.add(eye);
    });
    // Nez en fente
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 3), socket);
    nose.rotation.x = Math.PI;
    nose.position.set(0, 0.0, 0.3);
    head.add(nose);
    // Cornes torsadées
    [-1, 1].forEach((side) => {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 0.16, 0.3, -0.02),
            new THREE.Vector3(side * 0.32, 0.5, -0.12),
            new THREE.Vector3(side * 0.36, 0.72, -0.32),
            new THREE.Vector3(side * 0.26, 0.82, -0.5),
        ]);
        const horn = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.045, 7), darkBone);
        // Corne effilée : on réduit le rayon vers la pointe
        const pos = horn.geometry.attributes.position;
        const centers = curve.getSpacedPoints(16);
        for (let v = 0; v < pos.count; v++) {
            const ring = Math.floor(v / 8);
            const center = centers[Math.min(ring, 16)];
            const k = 1 - ring / 17;
            pos.setXYZ(v, center.x + (pos.getX(v) - center.x) * k, center.y + (pos.getY(v) - center.y) * k, center.z + (pos.getZ(v) - center.z) * k);
        }
        head.add(horn);
    });
    // Rangée de crocs du haut
    const fang = mat(0xece4cc, { r: 0.4 });
    for (let i = 0; i < 8; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.1 + (i % 2) * 0.05, 5), fang);
        tooth.rotation.x = Math.PI;
        const a = -0.9 + (i / 7) * 1.8;
        tooth.position.set(Math.sin(a) * 0.15, -0.14, 0.12 + Math.cos(a) * 0.14);
        head.add(tooth);
    }
    // Mâchoire qui s'ouvre (charnière à l'arrière)
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.12, -0.04);
    head.add(jaw);
    const jawBone = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bone);
    jawBone.scale.set(0.95, 0.6, 1.2);
    jawBone.position.set(0, 0.02, 0.15);
    jaw.add(jawBone);
    const throat = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), mat(0x3a0008, { e: 0x400008, side: THREE.DoubleSide }));
    throat.rotation.x = -Math.PI / 2;
    throat.position.set(0, 0.015, 0.15);
    jaw.add(throat);
    for (let i = 0; i < 7; i++) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.09, 5), fang);
        const a = -0.85 + (i / 6) * 1.7;
        tooth.position.set(Math.sin(a) * 0.14, 0.05, 0.16 + Math.cos(a) * 0.13);
        jaw.add(tooth);
    }

    // Bras interminables : épaule → coude → main à quatre griffes
    const arms = [-1, 1].map((side) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.36, 0.98, 0.04);
        shoulder.rotation.z = side * 0.18;
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.75, 8), skin);
        upper.position.y = -0.37;
        shoulder.add(upper);
        const elbow = new THREE.Group();
        elbow.position.y = -0.75;
        shoulder.add(elbow);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), darkBone);
        elbow.add(knob);
        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.8, 8), skin);
        fore.position.y = -0.4;
        elbow.add(fore);
        const hand = new THREE.Group();
        hand.position.y = -0.82;
        elbow.add(hand);
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skin);
        palm.scale.set(1, 1.2, 0.6);
        hand.add(palm);
        for (let k = 0; k < 4; k++) {
            const finger = new THREE.Group();
            finger.position.set(-0.06 + k * 0.04, -0.05, 0);
            finger.rotation.set(0.3, 0, -0.25 + k * 0.17);
            const bonePart = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.18, 5), skin);
            bonePart.position.y = -0.09;
            finger.add(bonePart);
            const claw = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.16, 5), fang);
            claw.rotation.x = Math.PI + 0.3;
            claw.position.set(0, -0.24, 0.02);
            finger.add(claw);
            hand.add(finger);
        }
        torso.add(shoulder);
        return { shoulder, elbow, hand };
    });

    // Brume rouge sombre qui rampe à ses pieds
    const count = 46;
    const mistGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = [];
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.2 + Math.random() * 0.75;
        seeds.push({ a, r, s: 0.3 + Math.random() * 0.8, h: Math.random() });
        positions.set([Math.cos(a) * r, Math.random() * 0.5, Math.sin(a) * r], i * 3);
    }
    mistGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mist = new THREE.Points(mistGeometry, new THREE.PointsMaterial({
        size: 0.55, map: dotTexture(), color: 0x7a1020, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    mist.userData.seeds = seeds;
    root.add(mist);

    // Lueur rouge des yeux, qui éclaire son crâne par en dessous
    const glow = new THREE.PointLight(0xff2020, 1.2, 1.6, 2);
    glow.position.set(0, -0.25, 0.55);
    head.add(glow);

    root.userData = { rig, torso, neck, head, jaw, arms, legs, strips, mist, eyeMaterial, glow };
    shadowy(root);
    mist.castShadow = false;
    return root;
}

/** Étiquette de calcul (« 🦁 + 3 ») toujours tournée vers la caméra. */
export function labelSprite(text, { bg = '#fffaf0', fg = '#1b1420', border = '#000', width = 1.9, font = 54 } = {}) {
    const texture = canvasTexture(320, 128, (c, w, h) => {
        c.fillStyle = border;
        c.beginPath();
        c.roundRect(10, 12, w - 14, h - 18, 24);
        c.fill();
        c.fillStyle = bg;
        c.beginPath();
        c.roundRect(4, 4, w - 16, h - 18, 24);
        c.fill();
        c.fillStyle = fg;
        c.font = `bold ${font}px "Bricolage Grotesque", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, w / 2 - 6, h / 2 - 4);
    });
    // Couleur un peu atténuée et sans « tone mapping » : le texte reste net, sans halo du bloom.
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, toneMapped: false, color: 0xcfcfcf }));
    sprite.scale.set(width, width * 0.4, 1);
    sprite.renderOrder = 10;
    return sprite;
}

/** Petits mouvements des objets portés : auréole qui flotte, cape et ailes qui bougent. */
export function animateGear(avatar, t) {
    avatar.traverse((child) => {
        if (child.userData.float) child.position.y = 0.32 + Math.sin(t * 2.4) * 0.04;
        if (child.userData.cape) child.userData.cape.rotation.x = -0.12 - Math.sin(t * 1.8) * 0.06;
        if (child.userData.wings) child.userData.wings.forEach((wing) => { wing.rotation.y = wing.userData.side * (-0.35 - Math.sin(t * 3) * 0.2); });
    });
}
