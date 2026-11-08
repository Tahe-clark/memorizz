import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Socle commun des scènes 3D : rendu (ombres douces, tons « cinéma »), halo
// lumineux (bloom), caméra, redimensionnement et boucle d'animation.
// La boucle s'arrête quand la scène sort de l'écran ou que l'onglet est caché.

export function createEngine(mount, { background = 0x000000, exposure = 1.2, bloom = [0.45, 0.5, 0.9], fov = 40, ratio = 0.6, maxVh = 0.62, minHeight = 220 } = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    if (background !== null) scene.background = new THREE.Color(background);
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 300);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(800, 500), ...bloom);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const r = typeof ratio === 'function' ? ratio(width) : ratio; // proportions, selon la largeur
        const height = Math.max(minHeight, Math.min(Math.round(width * r), Math.round(window.innerHeight * maxVh)));
        renderer.setSize(width, height);
        composer.setSize(width, height);
        bloomPass.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    // La scène n'est rendue que si elle est visible à l'écran (économise la batterie).
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(mount);

    const callbacks = new Set();
    const clock = new THREE.Clock();
    let frame;
    const loop = () => {
        frame = requestAnimationFrame(loop);
        const dt = clock.getDelta();
        if (!visible) return;
        const t = clock.elapsedTime;
        callbacks.forEach((fn) => fn(t, dt));
        composer.render();
    };
    loop();

    return {
        renderer,
        scene,
        camera,
        composer,
        bloom: bloomPass,
        clock,
        onFrame(fn) {
            callbacks.add(fn);
            return () => callbacks.delete(fn);
        },
        dispose() {
            cancelAnimationFrame(frame);
            observer.disconnect();
            io.disconnect();
            callbacks.clear();
            scene.traverse((child) => {
                child.geometry?.dispose();
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((m) => {
                    m?.map?.dispose();
                    m?.dispose();
                });
            });
            composer.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
}
