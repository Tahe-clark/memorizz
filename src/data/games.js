// Catalogue des jeux affichés sur l'accueil.
// Pour activer un nouveau jeu : passer "available" à true et ajouter sa vue dans App.jsx.
export const GAMES = [
    { id: 'wordswap', name: 'WordSwap Calc', available: true, color: 'sun', players: 1 },
    { id: 'battle', name: 'Battle', available: true, color: 'sky', players: 2 },
    { id: 'escape', name: 'Escape', available: true, color: 'mint', players: 1 },
    // Carte « prochain jeu » : annonce un jeu en cours de développement
    { id: 'next', name: '???', available: false, color: 'soon', players: 1 },
];
