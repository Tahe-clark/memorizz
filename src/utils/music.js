import { getAudio } from './audio';
import { readStorage, writeStorage } from './storage';

// Musique de fond.
//  - Menus : le morceau public/music.mp3, joué en boucle.
//  - Combats (mode Battle), pendant la mémorisation : un beat généré en direct avec
//    l'API Web Audio, au même tempo que le morceau (ambiance 'battle').
//  - Combats, le reste du temps : le morceau public/battle.mp3 (ambiance 'fight'),
//    recalé à 104 BPM et coupé sur 10 mesures pour boucler sur la grille.
// Un beat marqué (au même tempo que le morceau) : grosse caisse, caisse claire sur
// les temps 2 et 4, charleston, et une ligne de basse qui porte la musique sur
// quatre accords (la mineur, fa, do, sol).
//  - 'menu'   : version allégée (pas de caisse claire, tout plus doux)
//  - 'battle' : le beat complet
//
// L'horloge du tempo est indépendante du son : le mode Battle s'en sert pour
// caler les calculs et les coups sur les temps, même si la musique est coupée.

// Tempo du morceau public/music.mp3 (« Smooth Bass » : 104 BPM, premier temps à 0,317 s).
// À ajuster si le morceau change : tout le mode Battle se cale dessus.
export const BPM = 104;
const SONG_FIRST_BEAT = 0.317; // secondes
const STEPS_PER_BEAT = 4; // des doubles croches
const STEPS_PER_BAR = 16;
const STEP_MS = 60000 / BPM / STEPS_PER_BEAT;
export const BEAT_MS = STEP_MS * STEPS_PER_BEAT;

const midi = (note) => 440 * 2 ** ((note - 69) / 12);

const CHORDS = [
    { bass: 45, pad: [57, 60, 64] }, // la mineur
    { bass: 41, pad: [53, 57, 60] }, // fa
    { bass: 48, pad: [55, 60, 64] }, // do
    { bass: 43, pad: [55, 59, 62] }, // sol
];
// Motifs sur 16 pas. Pour la basse : écart en demi-tons par rapport à la note
// de l'accord (null = silence). Deux variantes qui alternent toutes les 4 mesures.
const KICK = [0, 7, 10];
const SNARE = [4, 12];
const BASS = [
    [0, null, null, null, null, null, null, 0, null, null, 7, null, null, null, 10, null],
    [0, null, null, 12, null, null, null, 0, null, null, 7, null, 5, null, 3, null],
];
const STAB = [6, 14]; // petit accord à contretemps

const VOLUME = { menu: 0.3, battle: 0.42, fight: 0.42 };

let enabled = readStorage('music', true);
let mood = 'menu';
let timer = null;
let out = null; // volume général de la musique
let noiseBuffer = null;
let origin = performance.now(); // instant (ms) du pas 0 de la grille
let step = 0;
let song = null; // le morceau public/music.mp3, s'il existe
let songState = 'unknown'; // 'unknown' | 'loading' | 'ready' | 'none'

/* ---------- Horloge du tempo ---------- */

/** Numéro du temps en cours dans la mesure (0 à 3) et millisecondes avant le prochain temps. */
// Temps écoulé (ms) sur la grille du tempo. Quand le morceau joue, c'est sa
// position de lecture qui fait foi : l'image reste calée sur le son.
function gridElapsed() {
    if (fight && !fight.paused) return fight.currentTime * 1000;
    if (song && !song.paused) return (song.currentTime - SONG_FIRST_BEAT) * 1000;
    return performance.now() - origin;
}

export function beatNow() {
    const elapsed = gridElapsed();
    const beat = Math.floor(elapsed / BEAT_MS);
    return { beat: ((beat % 4) + 4) % 4, msToNext: BEAT_MS - (elapsed - beat * BEAT_MS) };
}

/**
 * Délai (ms) pour qu'un événement tombe sur la grille du tempo, au plus tôt dans
 * "afterMs". "division" : 1 = sur un temps, 0.5 = sur une croche, 4 = début de mesure.
 */
export function msToGrid(afterMs = 0, division = 1) {
    const unit = BEAT_MS * division;
    const target = gridElapsed() + afterMs;
    return afterMs + (Math.ceil(target / unit) * unit - target);
}

/* ---------- Instruments ---------- */

function voice(ctx, { note, at, duration, type = 'triangle', volume = 0.1, cutoff = 2400, attack = 0.012 }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(midi(note), at);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + duration + 0.03);
}

function drum(ctx, { at, duration, volume, freq, type = 'highpass', q = 1 }) {
    if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    source.start(at);
    source.stop(at + duration + 0.02);
}

function kick(ctx, at, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(125, at);
    osc.frequency.exponentialRampToValueAtTime(40, at + 0.16);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
    osc.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + 0.26);
}

// Caisse claire : un souffle sec et un corps grave très court.
function snare(ctx, at, volume) {
    drum(ctx, { at, duration: 0.16, volume, freq: 1700, type: 'bandpass', q: 0.8 });
    voice(ctx, { note: 55, at, duration: 0.09, type: 'triangle', volume: volume * 0.9, cutoff: 900, attack: 0.002 });
}

// Une note de basse : un sinus profond, doublé une octave au-dessus (très doux)
// pour rester audible sur les petits haut-parleurs d'ordinateur portable.
function bassNote(ctx, note, at, duration, volume) {
    voice(ctx, { note, at, duration, type: 'sine', volume, cutoff: 700, attack: 0.01 });
    voice(ctx, { note: note + 12, at, duration: duration * 0.8, type: 'triangle', volume: volume * 0.32, cutoff: 520, attack: 0.01 });
}

// Programme toutes les notes d'un pas (une double croche) à l'instant "at".
function playStep(ctx, index, at) {
    const bar = Math.floor(index / STEPS_PER_BAR);
    const pos = index % STEPS_PER_BAR;
    const chord = CHORDS[bar % CHORDS.length];
    const variant = Math.floor(bar / CHORDS.length) % 2;
    const full = mood !== 'menu';
    const stepS = STEP_MS / 1000;
    // Léger « swing » : les doubles croches impaires arrivent un peu en retard.
    const time = pos % 2 === 1 ? at + stepS * 0.14 : at;

    if (KICK.includes(pos)) kick(ctx, time, full ? 0.34 : 0.2);
    if (full && SNARE.includes(pos)) snare(ctx, time, 0.11);
    // Charleston : croches, avec quelques doubles croches plus faibles
    if (pos % 2 === 0) drum(ctx, { at: time, duration: 0.04, volume: full ? 0.03 : 0.016, freq: 6500 });
    else if (full && (pos === 3 || pos === 11 || pos === 15)) drum(ctx, { at: time, duration: 0.03, volume: 0.014, freq: 7000 });

    const offset = BASS[variant][pos];
    if (offset !== null) bassNote(ctx, chord.bass + offset, time, stepS * (pos === 0 ? 5 : 2.4), 0.3);

    if (STAB.includes(pos)) {
        chord.pad.forEach((note) => voice(ctx, { note, at: time, duration: stepS * 1.6, volume: full ? 0.03 : 0.02, cutoff: 780, attack: 0.006 }));
    }
}

/* ---------- Séquenceur ---------- */

function schedule() {
    const audio = getAudio();
    if (!audio) return;
    const { ctx } = audio;
    const now = performance.now();
    // Après une pause (onglet caché), on reprend au pas courant de la grille.
    const current = Math.ceil((now - origin) / STEP_MS);
    if (step < current) step = current;
    while (origin + step * STEP_MS < now + 250) {
        const at = ctx.currentTime + (origin + step * STEP_MS - now) / 1000;
        playStep(ctx, step, Math.max(at, ctx.currentTime));
        step += 1;
    }
}

function stopBeat() {
    clearInterval(timer);
    timer = null;
    const audio = out && getAudio();
    if (audio) out.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.08);
}

function stop() {
    stopBeat();
    if (song) song.pause();
    if (fight) fight.pause();
}

/* ---------- Morceau des menus ----------
   public/music.mp3 est joué en boucle sur l'accueil, les réglages et les bilans.
   S'il n'existe pas, le beat généré (version douce) le remplace. */
const SONG_URL = `${import.meta.env.BASE_URL}music.mp3`;
const SONG_VOLUME = 0.45;
const FIGHT_URL = `${import.meta.env.BASE_URL}battle.mp3`;
let fight = null; // le morceau des combats
let fightState = 'unknown'; // 'unknown' | 'none'

/** Démarre la musique (à appeler après un premier clic : les navigateurs l'exigent). */
export function startMusic() {
    if (!enabled || held || track || document.hidden) return;
    // Pendant un combat : le beat dynamique. Partout ailleurs : le morceau doux.
    if (mood === 'fight' && fightState !== 'none') {
        if (song) song.pause();
        stopBeat();
        if (!fight) {
            fight = new Audio(FIGHT_URL);
            fight.loop = true;
            fight.volume = 0.5;
            fight.addEventListener('error', () => {
                fightState = 'none'; // pas de fichier : le beat généré prend le relais
                fight = null;
                startMusic();
            }, { once: true });
        }
        fight.play().catch(() => {});
        return;
    }
    if (fight) fight.pause();
    if (mood !== 'menu') {
        if (song) song.pause();
        startBeat();
        return;
    }
    stopBeat();
    if (songState === 'ready') {
        song.volume = SONG_VOLUME;
        song.play().catch(() => {});
        return;
    }
    if (songState === 'none') {
        startBeat();
        return;
    }
    if (songState === 'loading') return;
    songState = 'loading';
    const candidate = new Audio(SONG_URL);
    candidate.loop = true;
    candidate.addEventListener('canplay', () => {
        if (songState !== 'loading') return;
        song = candidate;
        songState = 'ready';
        startMusic();
    }, { once: true });
    candidate.addEventListener('error', () => {
        songState = 'none'; // pas de fichier : on garde le beat généré
        startMusic();
    }, { once: true });
    candidate.load();
}

function startBeat() {
    if (timer) return;
    const audio = getAudio();
    if (!audio) return;
    if (!out) {
        out = audio.ctx.createGain();
        out.gain.value = 0;
        out.connect(audio.master);
    }
    out.gain.setTargetAtTime(VOLUME[mood], audio.ctx.currentTime, 0.3);
    timer = setInterval(schedule, 60);
}

/* ---------- Morceau enregistré (duel au Far West) ---------- */

let track = null;

/** Remplace la musique générée par un fichier audio joué en boucle. */
export function playTrack(url) {
    stopTrack();
    if (!enabled) return;
    stop();
    track = new Audio(url);
    track.loop = true;
    track.volume = 0.55;
    track.play().catch(() => {
        // Lecture refusée ou fichier absent : on garde la musique générée.
        track = null;
        startMusic();
    });
}

/** Arrête le morceau et reprend la musique générée. */
export function stopTrack() {
    if (!track) return;
    track.pause();
    track = null;
    startMusic();
}

/** Change d'ambiance : 'menu', 'battle' (mémorisation) ou 'fight' (combat). Le tempo ne change pas, la grille continue. */
export function setMusicMood(next) {
    if (mood === next) return;
    mood = next;
    // On repart d'un début de mesure pour que le combat commence sur le premier temps.
    origin = performance.now() + 60;
    step = 0;
    if (fight) fight.currentTime = 0; // le morceau de combat repart sur son premier temps
    startMusic(); // bascule entre le morceau (menus) et le beat (combat)
}

let held = false;
/** Met la musique en pause le temps d'une vidéo, puis la relance. */
export function holdMusic(on) {
    held = on;
    if (on) stop();
    else startMusic();
}

export function isMusicEnabled() {
    return enabled;
}

export function setMusicEnabled(value) {
    enabled = value;
    writeStorage('music', value);
    if (track) track.muted = !value;
    else if (value) startMusic();
    else stop();
}

// Pas de musique dans un onglet caché.
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else startMusic();
});
