import { readStorage, writeStorage } from './storage';

// Bruitages synthétisés avec l'API Web Audio (aucun fichier son à charger).
// Chaque son combine des notes douces (sinus/triangle avec attaque progressive)
// et du souffle filtré, pour éviter les bips agressifs.

// Un seul AudioContext partagé : les navigateurs limitent le nombre de contextes.
let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = readStorage('muted', false);

function getContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
        ctx = new AudioCtx();
        // Un compresseur adoucit les pics quand plusieurs sons se superposent.
        const compressor = ctx.createDynamicsCompressor();
        master = ctx.createGain();
        master.gain.value = 0.7;
        master.connect(compressor);
        compressor.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

/** Contexte audio partagé (bruitages et musique). Null si le navigateur ne le permet pas. */
export function getAudio() {
    const c = getContext();
    return c ? { ctx: c, master } : null;
}

export function isMuted() {
    return muted;
}

export function setMuted(value) {
    muted = value;
    writeStorage('muted', value);
}

// Enveloppe : montée rapide puis extinction douce (pas de « clic » au début ni à la fin).
function envelope(c, at, duration, volume, attack = 0.008) {
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    gain.connect(master);
    return gain;
}

/** Une note. "to" fait glisser la hauteur jusqu'à cette fréquence. */
function tone(c, { freq, to, type = 'sine', at = 0, duration = 0.2, volume = 0.1, attack }) {
    const start = c.currentTime + at;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    osc.connect(envelope(c, start, duration, volume, attack));
    osc.start(start);
    osc.stop(start + duration + 0.02);
}

/** Un souffle filtré (impact, mouvement d'air). "to" fait glisser le filtre. */
function noise(c, { freq, to, q = 1, filter = 'bandpass', at = 0, duration = 0.15, volume = 0.1, attack }) {
    if (!noiseBuffer) {
        noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const start = c.currentTime + at;
    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const biquad = c.createBiquadFilter();
    biquad.type = filter;
    biquad.Q.value = q;
    biquad.frequency.setValueAtTime(freq, start);
    if (to) biquad.frequency.exponentialRampToValueAtTime(to, start + duration);
    source.connect(biquad);
    biquad.connect(envelope(c, start, duration, volume, attack));
    source.start(start);
    source.stop(start + duration + 0.02);
}

// Une cloche : la note et un harmonique plus aigu qui s'éteint plus vite.
function bell(c, freq, at, volume = 0.09, duration = 0.7) {
    tone(c, { freq, at, duration, volume });
    tone(c, { freq: freq * 2.76, at, duration: duration * 0.4, volume: volume * 0.35 });
}

/* ---------- Sons du Far West ---------- */

// Écho du canyon : une réverbération synthétique (souffle qui s'éteint + deux
// échos sur les falaises), créée une seule fois et partagée.
let canyon = null;
function canyonVerb(c) {
    if (canyon) return canyon;
    const length = Math.floor(c.sampleRate * 2.6);
    const impulse = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            const tail = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.5) * 0.5;
            data[i] = i < c.sampleRate * 0.015 ? 0 : tail;
        }
        // Échos francs, un peu décalés entre gauche et droite
        [[0.31, 0.9], [0.62, 0.5], [0.97, 0.25]].forEach(([at, amp]) => {
            const start = Math.floor((at + ch * 0.03) * c.sampleRate);
            for (let i = 0; i < 900; i++) data[start + i] += (Math.random() * 2 - 1) * amp * (1 - i / 900);
        });
    }
    const convolver = c.createConvolver();
    convolver.buffer = impulse;
    const wet = c.createGain();
    wet.gain.value = 0.6;
    convolver.connect(wet);
    wet.connect(master);
    canyon = convolver;
    return canyon;
}

// Un éclat de bruit filtré envoyé vers "out" (pas directement vers la sortie).
function burst(c, out, { at = 0, freq, filter = 'bandpass', q = 0.7, duration, volume }) {
    if (!noiseBuffer) noise(c, { freq: 1000, volume: 0.0001, duration: 0.01 });
    const start = c.currentTime + at;
    const source = c.createBufferSource();
    source.buffer = noiseBuffer;
    const biquad = c.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.value = freq;
    biquad.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(out);
    source.start(start, Math.random() * 0.5);
    source.stop(start + duration + 0.05);
}

/** Coup de revolver : claquement sec, souffle, onde grave, puis écho du canyon. */
function gunshot(c) {
    const out = c.createGain();
    out.gain.value = 1;
    out.connect(master);
    out.connect(canyonVerb(c));
    burst(c, out, { freq: 3800, filter: 'highpass', duration: 0.05, volume: 1.4 });
    burst(c, out, { freq: 1400, q: 0.5, duration: 0.18, volume: 1.1 });
    burst(c, out, { freq: 420, filter: 'lowpass', duration: 0.5, volume: 1.2 });
    const start = c.currentTime;
    const osc = c.createOscillator();
    osc.frequency.setValueAtTime(120, start);
    osc.frequency.exponentialRampToValueAtTime(32, start + 0.4);
    const gain = c.createGain();
    gain.gain.setValueAtTime(1, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(start + 0.5);
}

/** Corde de guitare pincée (son de western) : dent de scie filtrée qui s'éteint. */
function pluck(c, freq, at = 0, volume = 0.16, duration = 1.6) {
    const start = c.currentTime + at;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.01, start);
    osc.frequency.exponentialRampToValueAtTime(freq, start + 0.08);
    const lowpass = c.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, start);
    lowpass.frequency.exponentialRampToValueAtTime(380, start + duration * 0.6);
    const gain = envelope(c, start, duration, volume, 0.004);
    osc.connect(lowpass);
    lowpass.connect(gain);
    if (canyon) gain.connect(canyon);
    osc.start(start);
    osc.stop(start + duration + 0.05);
}

const SOUNDS = {
    // Bonne réponse : deux notes claires qui montent
    success: (c) => {
        bell(c, 659.25, 0, 0.09, 0.35);
        bell(c, 987.77, 0.11, 0.09, 0.5);
    },
    // Mauvaise réponse : deux notes graves et feutrées qui descendent
    fail: (c) => {
        tone(c, { freq: 233, to: 196, type: 'triangle', duration: 0.16, volume: 0.11 });
        tone(c, { freq: 174, to: 146, type: 'triangle', at: 0.13, duration: 0.24, volume: 0.11 });
    },
    // Compte à rebours : petit « toc » de bois
    tick: (c) => {
        tone(c, { freq: 880, to: 620, duration: 0.05, volume: 0.05, attack: 0.002 });
    },
    // Bras qui fend l'air
    whoosh: (c) => {
        noise(c, { freq: 500, to: 2600, q: 1.4, duration: 0.2, volume: 0.1, attack: 0.07 });
    },
    // Coup de poing : choc sourd + claquement
    punch: (c) => {
        tone(c, { freq: 170, to: 45, duration: 0.2, volume: 0.5, attack: 0.003 });
        noise(c, { freq: 1100, q: 0.7, duration: 0.07, volume: 0.3, attack: 0.002 });
        noise(c, { freq: 220, filter: 'lowpass', duration: 0.12, volume: 0.25, attack: 0.002 });
    },
    // Début du combat : cloche de ring
    bell: (c) => {
        bell(c, 1318.5, 0, 0.08, 0.6);
        bell(c, 1318.5, 0.16, 0.08, 0.9);
    },
    // K.O. : chute lourde puis trois coups de cloche
    ko: (c) => {
        tone(c, { freq: 120, to: 34, duration: 0.5, volume: 0.5, attack: 0.004 });
        noise(c, { freq: 160, filter: 'lowpass', duration: 0.3, volume: 0.3, attack: 0.004 });
        [0.35, 0.53, 0.71].forEach((at) => bell(c, 1318.5, at, 0.07, 0.8));
    },
    // Coup de feu (duel au Far West) : claquement sec + détonation grave
    gunshot: (c) => gunshot(c),
    // Chien du revolver qu'on arme : deux petits clics métalliques
    cock: (c) => {
        noise(c, { freq: 5200, q: 4, duration: 0.03, volume: 0.35, attack: 0.001 });
        noise(c, { freq: 3600, q: 4, at: 0.09, duration: 0.04, volume: 0.4, attack: 0.001 });
    },
    // Guitare de western qui glisse vers le grave (ouverture de la cinématique)
    twang: (c) => {
        canyonVerb(c);
        pluck(c, 164.8, 0, 0.17, 2.2);
        pluck(c, 246.9, 0.05, 0.1, 1.8);
        tone(c, { freq: 330, to: 220, type: 'triangle', at: 0.3, duration: 1.2, volume: 0.05 });
    },
    // Battements de cœur pendant les gros plans
    heartbeat: (c) => {
        [0, 0.22].forEach((at, i) => tone(c, { freq: 62, to: 40, at, duration: 0.18, volume: i ? 0.4 : 0.55, attack: 0.005 }));
    },
    // Vent qui souffle sur le désert
    wind: (c) => {
        noise(c, { freq: 300, to: 900, q: 1.5, duration: 1.4, volume: 0.12, attack: 0.5 });
    },
    // Accord final avant le duel : guitare et coup sourd
    sting: (c) => {
        canyonVerb(c);
        [82.4, 123.5, 164.8, 207.7].forEach((f, i) => pluck(c, f, i * 0.025, 0.14, 2.4));
        tone(c, { freq: 70, to: 38, duration: 0.6, volume: 0.45, attack: 0.004 });
        noise(c, { freq: 600, filter: 'lowpass', duration: 0.5, volume: 0.25, attack: 0.002 });
    },
    // Balle qui rate sa cible : sifflement qui file
    ricochet: (c) => {
        tone(c, { freq: 2400, to: 500, type: 'triangle', at: 0.08, duration: 0.45, volume: 0.09, attack: 0.01 });
    },
    // La boule de cactus qui rebondit sur le ring
    boing: (c) => {
        tone(c, { freq: 180, to: 420, type: 'triangle', duration: 0.18, volume: 0.16 });
        tone(c, { freq: 240, to: 520, type: 'triangle', at: 0.2, duration: 0.14, volume: 0.1 });
    },
    // Coup final : l'énergie monte pendant deux secondes…
    charge: (c) => {
        tone(c, { freq: 70, to: 520, type: 'sawtooth', duration: 1.85, volume: 0.1, attack: 0.5 });
        tone(c, { freq: 140, to: 1040, type: 'triangle', duration: 1.85, volume: 0.07, attack: 0.6 });
        noise(c, { freq: 300, to: 5200, q: 2, duration: 1.85, volume: 0.09, attack: 0.9 });
        [0.3, 0.75, 1.1, 1.4, 1.62].forEach((at) => noise(c, { freq: 4200, q: 3, at, duration: 0.05, volume: 0.12, attack: 0.002 }));
    },
    // …puis le coup géant : une détonation
    megaPunch: (c) => {
        tone(c, { freq: 220, to: 28, duration: 0.9, volume: 0.6, attack: 0.002 });
        noise(c, { freq: 900, q: 0.5, duration: 0.25, volume: 0.5, attack: 0.001 });
        noise(c, { freq: 180, filter: 'lowpass', duration: 0.9, volume: 0.5, attack: 0.002 });
        tone(c, { freq: 1800, to: 300, type: 'triangle', at: 0.05, duration: 0.5, volume: 0.08 });
    },
    // Victoire du match : petit arpège joyeux
    win: (c) => {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => bell(c, freq, i * 0.11, 0.08, i === 3 ? 0.9 : 0.3));
    },
};

export function playSound(type) {
    if (muted || !SOUNDS[type]) return;
    try {
        const c = getContext();
        if (c) SOUNDS[type](c);
    } catch (e) {
        console.warn("L'API Web Audio est bloquée ou non supportée par votre navigateur.", e);
    }
}
