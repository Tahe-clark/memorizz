// Le navigateur sait-il afficher de la vraie 3D (WebGL) ? Sinon, on garde la 3D en CSS.
let cached = null;
export function hasWebGL() {
    if (cached === null) {
        try {
            const canvas = document.createElement('canvas');
            cached = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
        } catch {
            cached = false;
        }
    }
    return cached;
}
