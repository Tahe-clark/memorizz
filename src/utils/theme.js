// Memorizz est maintenant toujours en mode sombre (il n'y a plus de bouton pour changer).
export function getTheme() {
    return 'dark';
}

export function applyTheme() {
    document.documentElement.dataset.theme = 'dark';
}
