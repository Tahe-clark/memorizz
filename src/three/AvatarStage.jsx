import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { animateGear, avatarModel, canvasTexture, dispose } from './models';
import { applyPose, dancePose } from './rig';

// Le skin du joueur en 3D sur l'accueil : fond transparent, il respire, suit la
// souris du regard, se balance, et fait sa danse de temps en temps.
// Pas de post-traitement ici : le canvas reste transparent au-dessus de l'image.

export default function AvatarStage({ player, onFail }) {
    const mountRef = useRef(null);
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
        scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3550, 1.5));
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(3, 5, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xff5a6a, 2.6); // contre-jour rouge, comme l'image derrière
        rim.position.set(-4, 3, -3);
        scene.add(rim);
        const rim2 = new THREE.DirectionalLight(0x7a80ff, 2);
        rim2.position.set(4, 2, -4);
        scene.add(rim2);

        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
        camera.position.set(0, 1.25, 6.4);
        camera.lookAt(0, 0.95, 0);

        const avatar = avatarModel(player, 'happy');
        scene.add(avatar);
        // Ombre douce au sol
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.85, 32),
            new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                map: canvasTexture(128, 128, (c, w) => {
                    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
                    g.addColorStop(0, 'rgba(0,0,0,0.55)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    c.fillStyle = g;
                    c.fillRect(0, 0, w, w);
                }),
            }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        scene.add(shadow);
        // Socle lumineux sous ses pieds (dans la scène, donc toujours bien placé)
        const glow = (inner, outer, color, opacity) => {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(inner, outer, 64),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.012;
            scene.add(ring);
            return ring;
        };
        const ring = glow(0.92, 0.98, 0xffffff, 0.75);
        const halo = glow(0.6, 1.3, 0xff4a5a, 0.18);

        const resize = () => {
            const w = Math.max(1, mount.clientWidth);
            const h = Math.max(1, mount.clientHeight);
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        // Il suit la souris du regard
        const look = { x: 0, y: 0 };
        const onMove = (e) => {
            look.x = (e.clientX / window.innerWidth - 0.5) * 2;
            look.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('pointermove', onMove);

        const clock = new THREE.Clock();
        let frame;
        let danceAt = 2.5;
        const loop = () => {
            frame = requestAnimationFrame(loop);
            const dt = Math.min(clock.getDelta(), 0.05);
            const t = clock.elapsedTime;
            const breathe = Math.sin(t * 2.2);
            let pose = { y: (breathe + 1) * 0.012, tz: breathe * 0.015, a0z: -0.16 - breathe * 0.03, a1z: 0.16 + breathe * 0.03, ty: look.x * 0.25, tx: look.y * 0.08 };
            if (t > danceAt) {
                const x = t - danceAt;
                if (x < 1.6) pose = dancePose(player.emote, x);
                else danceAt = t + 6 + Math.random() * 4;
            }
            applyPose(avatar, pose, dt, 10);
            animateGear(avatar, t);
            ring.material.opacity = 0.6 + Math.sin(t * 2) * 0.15;
            halo.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
            avatar.rotation.y = THREE.MathUtils.damp(avatar.rotation.y, -0.35 + look.x * 0.35, 3, dt);
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('pointermove', onMove);
            dispose(scene);
            renderer.dispose();
            renderer.domElement.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reconstruit quand le skin change
    }, [playerKey]);

    return <div className="avatar-stage" ref={mountRef} aria-hidden="true" />;
}
