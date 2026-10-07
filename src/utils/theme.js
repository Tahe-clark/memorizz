import { readStorage, writeStorage } from './storage';

// Thème clair / sombre. Sans choix enregistré, on suit le réglage du système.
export function getTheme() {
    const saved = readStorage('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
    writeStorage('theme', theme);
    applyTheme(theme);
}
