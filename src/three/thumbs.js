import * as THREE from 'three';
import { avatarModel, dispose } from './models';
import { applyPose } from './rig';

// Vignettes du casier : chaque objet rendu en 3D avec le skin du joueur.

function lights(scene) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2840, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff9db4, 2.6);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0x8fc4ff, 1.8);
    rim2.position.set(4, 2, -4);
    scene.add(rim2);
}

let thumbRenderer = null;
const thumbScene = new THREE.Scene();
let thumbLit = false;

/**
 * Rend une vignette par objet, avec le skin du joueur.
 * items = [{ key, player, view: 'body' | 'head' | 'back' }] → { key: image (data URL) }
 * On rend une vignette par tâche pour ne pas bloquer la page.
 */
export async function renderThumbs(items) {
    if (!thumbRenderer) {
        thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        thumbRenderer.setPixelRatio(1);
        thumbRenderer.setSize(220, 220);
        thumbRenderer.setClearColor(0x000000, 0);
        thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        thumbRenderer.toneMappingExposure = 1.15;
    }
    if (!thumbLit) {
        lights(thumbScene);
        thumbLit = true;
    }
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const out = {};
    for (const item of items) {
        const avatar = avatarModel(item.player, 'happy');
        const height = avatar.userData.height;
        applyPose(avatar, { a0z: -0.25, a1z: 0.25 }, 1, 100);
        if (item.view === 'head') {
            avatar.rotation.y = -0.45;
            camera.position.set(0, height + 0.25, 2.6);
            camera.lookAt(0, height - 0.05, 0);
        } else if (item.view === 'back') {
            avatar.rotation.y = Math.PI * 0.78;
            camera.position.set(0, 1.25, 4.6);
            camera.lookAt(0, 0.95, 0);
        } else {
            avatar.rotation.y = -0.4;
            camera.position.set(0, 1.2, 5.2);
            camera.lookAt(0, 0.92, 0);
        }
        thumbScene.add(avatar);
        thumbRenderer.render(thumbScene, camera);
        out[item.key] = thumbRenderer.domElement.toDataURL('image/png');
        thumbScene.remove(avatar);
        dispose(avatar);
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return out;
}
