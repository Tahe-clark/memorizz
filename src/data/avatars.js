// Avatars du mode Battle et options de personnalisation.
// Le dessin de chaque avatar est dans components/Avatar.jsx.

// "height" : hauteur du corps (la largeur est toujours 110).
// "eyes" : position des yeux (pour les expressions et les lunettes).
export const AVATARS = {
    console: { height: 150, eyes: { cx1: 50, cx2: 76, cy: 46 } },
    tower: { height: 160, eyes: { cx1: 58, cx2: 84, cy: 58 } },
    tv: { height: 136, eyes: { cx1: 40, cx2: 64, cy: 50 } },
    radio: { height: 142, eyes: { cx1: 52, cx2: 78, cy: 32 } },
};
export const AVATAR_IDS = Object.keys(AVATARS);

// Couleurs du corps (le casier les propose toutes)
export const AVATAR_COLORS = [
    '#ffd23f', '#ffb37a', '#ff7a59', '#ff4f6d', '#ffb3c7', '#ff6fd8',
    '#c9b8ff', '#8b7bff', '#5b6cff', '#a9ccff', '#46c8ff', '#2fd1c5',
    '#9fe6c3', '#4cd964', '#b6e35a', '#f5f0e1', '#c7ccd8', '#6b7280',
    '#2b2f3a', '#e8c39e', '#d4a373', '#8a5a3c', '#7a1f3d', '#1f6f5c',
];

// Ce qu'on porte sur la tête
export const ACCESSORIES = ['none', 'bow', 'crown', 'cap', 'shades', 'cowboy', 'headphones', 'wizard', 'halo', 'horns', 'headband', 'beanie', 'party', 'tophat'];

// Ce qu'on porte dans le dos
export const BACK_ITEMS = ['none', 'katana', 'cape', 'wings', 'jetpack', 'backpack'];

// Couleurs des gants de boxe
export const GLOVE_COLORS = [
    '#e5383b', '#ff7a1a', '#f4b400', '#2bd46a', '#00b3a4', '#46c8ff',
    '#2f6fed', '#8b7bff', '#ff4f86', '#ff6fd8', '#ffffff', '#9aa0b5',
    '#22252e', '#c9a227', '#7a1f3d', '#5a3c2a',
];

// Façons de fêter une victoire
export const EMOTES = ['jump', 'spin', 'wiggle', 'pump', 'flip', 'wave', 'robot', 'dab'];

export const DEFAULT_PLAYERS = [
    { name: '', avatar: 'console', color: '#ffd23f', accessory: 'none', back: 'none', gloves: '#e5383b', emote: 'jump' },
    { name: '', avatar: 'tower', color: '#a9ccff', accessory: 'bow', back: 'none', gloves: '#2f6fed', emote: 'spin' },
];

// Complète un joueur enregistré (anciennes sauvegardes, valeurs inconnues).
export function normalizePlayer(player, index) {
    const base = DEFAULT_PLAYERS[index];
    const merged = { ...base, ...player };
    if (!AVATARS[merged.avatar]) merged.avatar = base.avatar;
    if (!ACCESSORIES.includes(merged.accessory)) merged.accessory = base.accessory;
    if (!BACK_ITEMS.includes(merged.back)) merged.back = base.back;
    if (!EMOTES.includes(merged.emote)) merged.emote = base.emote;
    return merged;
}
