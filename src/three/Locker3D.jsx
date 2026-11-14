import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { animateGear, avatarModel, canvasTexture, dispose, mat } from './models';
import { applyPose, dancePose } from './rig';

// Le casier en 3D : le grand aperçu du personnage (on le fait tourner en le
// glissant à la souris ou au doigt) et les vignettes des objets, rendues à la
// volée avec le skin du joueur. Chargé seulement quand on ouvre le casier.

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

/** Grand aperçu du casier. « danceTick » change → il fait sa danse. */
export default function LockerStage({ player, danceTick, onFail }) {
    const mountRef = useRef(null);
    const danceRef = useRef(danceTick);
    const stateRef = useRef({ danceAt: -10 });
    const playerKey = JSON.stringify(player);

    useEffect(() => {
        const mount = mountRef.current;
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
            onFail?.();
            return undefined;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        mount.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        lights(scene);
        const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
        camera.position.set(0, 1.35, 6.6);
        camera.lookAt(0, 0.92, 0);

        // Socle : disque sombre et anneau lumineux
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.16, 48), mat(0x1a1b28, { r: 0.4, m: 0.3 }));
        pedestal.position.y = -0.08;
        scene.add(pedestal);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: 0xc2456a, toneMapped: false }));
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        const glowMap = canvasTexture(128, 128, (c, w) => {
            const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
            g.addColorStop(0, 'rgba(194,69,106,0.5)');
            g.addColorStop(1, 'rgba(194,69,106,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, w, w);
        });
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: glowMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.005;
        scene.add(glow);

        const avatar = avatarModel(player, 'happy');
        scene.add(avatar);

        const resize = () => {
            const w = Math.max(1, mount.clientWidth);
            const h = Math.max(1, mount.clientHeight);
            renderer.setSize(w, h);
            camera.aspect = w / h;
            // Sur un écran étroit, on recule pour garder tout le personnage
            camera.position.z = w / h < 0.8 ? 8.2 : 6.6;
            camera.updateProjectionMatrix();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        // Le faire tourner en le glissant
        let spin = -0.4;
        let velocity = 0;
        let dragging = null;
        const canvas = renderer.domElement;
        canvas.style.touchAction = 'pan-y';
        const down = (e) => { dragging = e.clientX; canvas.setPointerCapture(e.pointerId); };
        const move = (e) => {
            if (dragging === null) return;
            const dx = e.clientX - dragging;
            dragging = e.clientX;
            velocity = dx * 0.012;
            spin += velocity;
        };
        const up = () => { dragging = null; };
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', up);

        const clock = new THREE.Clock();
        let frame;
        const loop = () => {
            frame = requestAnimationFrame(loop);
            const dt = Math.min(clock.getDelta(), 0.05);
            const t = clock.elapsedTime;
            if (danceRef.current !== stateRef.current.tick) {
                stateRef.current.tick = danceRef.current;
                stateRef.current.danceAt = t;
            }
            if (dragging === null) {
                spin += velocity;
                velocity *= 0.92;
            }
            const x = t - stateRef.current.danceAt;
            const breathe = Math.sin(t * 2.2);
            const pose = x < 2.2
                ? dancePose(player.emote, x)
                : { y: (breathe + 1) * 0.012, tz: breathe * 0.015, a0z: -0.16 - breathe * 0.03, a1z: 0.16 + breathe * 0.03 };
            applyPose(avatar, pose, dt, 12);
            avatar.rotation.y = spin;
            animateGear(avatar, t);
            ring.material.color.setHSL(0.957, 0.55, 0.52 + Math.sin(t * 1.6) * 0.06);
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            canvas.removeEventListener('pointerdown', down);
            canvas.removeEventListener('pointermove', move);
            canvas.removeEventListener('pointerup', up);
            canvas.removeEventListener('pointercancel', up);
            dispose(scene);
            renderer.dispose();
            canvas.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reconstruit quand le skin change
    }, [playerKey]);

    useEffect(() => {
        danceRef.current = danceTick;
    }, [danceTick]);

    return <div className="locker-stage" ref={mountRef} aria-hidden="true" />;
}
