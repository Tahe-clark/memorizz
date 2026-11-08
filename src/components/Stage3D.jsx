import { lazy, Suspense, useState } from 'react';
import { hasWebGL } from '../utils/webgl';

// La vraie 3D de Battle (Three.js), téléchargée seulement quand on en a besoin.
// Pendant le chargement, ou si le navigateur ne gère pas WebGL, on affiche la
// version en 3D CSS (fallback).
const Battle3D = lazy(() => import('../three/Battle3D'));

export default function Stage3D({ fallback, ...props }) {
    const [failed, setFailed] = useState(() => !hasWebGL());
    if (failed) return fallback;
    return (
        <Suspense fallback={fallback}>
            <Battle3D {...props} onFail={() => setFailed(true)} />
        </Suspense>
    );
}
