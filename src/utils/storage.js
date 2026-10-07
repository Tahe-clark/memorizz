// Petites fonctions pour lire/écrire dans localStorage sans jamais planter
// (navigation privée, stockage bloqué, etc.).
const PREFIX = 'memorizz:';

export function readStorage(key, fallback = null) {
    try {
        const raw = window.localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeStorage(key, value) {
    try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
        // Stockage indisponible : on ignore, le jeu fonctionne quand même.
    }
}
