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

export const AVATAR_COLORS = ['#ffd23f', '#a9ccff', '#9fe6c3', '#ffb3c7', '#c9b8ff', '#ffb37a'];

export const ACCESSORIES = ['none', 'bow', 'crown', 'cap', 'shades'];

// Couleurs des gants de boxe
export const GLOVE_COLORS = ['#e5383b', '#2f6fed', '#22252e', '#f4b400', '#ffffff'];

// Façons de fêter une victoire
export const EMOTES = ['jump', 'spin', 'wiggle', 'pump', 'flip'];

export const DEFAULT_PLAYERS = [
    { name: '', avatar: 'console', color: '#ffd23f', accessory: 'none', gloves: '#e5383b', emote: 'jump' },
    { name: '', avatar: 'tower', color: '#a9ccff', accessory: 'bow', gloves: '#2f6fed', emote: 'spin' },
];

// Complète un joueur enregistré (anciennes sauvegardes, valeurs inconnues).
export function normalizePlayer(player, index) {
    const base = DEFAULT_PLAYERS[index];
    const merged = { ...base, ...player };
    if (!AVATARS[merged.avatar]) merged.avatar = base.avatar;
    if (!ACCESSORIES.includes(merged.accessory)) merged.accessory = base.accessory;
    if (!EMOTES.includes(merged.emote)) merged.emote = base.emote;
    return merged;
}
