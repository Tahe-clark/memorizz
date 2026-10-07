import { isMuted } from './audio';

// La voix de l'annonceur du mode Battle.
// Pour chaque réplique, on joue d'abord le fichier enregistré public/voice/<id>.mp3.
// S'il n'existe pas, on se rabat sur la synthèse vocale du navigateur (voix
// anglaise, grave et un peu lente). L'annonceur suit le bouton des bruitages.
export const VOICE_LINES = {
    round1: 'Round 1',
    round2: 'Round 2',
    final: 'Final round',
    fight: 'Fight!',
    ko: 'K O!',
    duel: 'Duel!',
    draw: 'Draw!',
    winner: 'We have a winner!',
    finisher: 'Final blow!',
};

const VOICE_FOLDER = `${import.meta.env.BASE_URL}voice/`;
const missing = new Set(); // répliques sans fichier : inutile de réessayer à chaque fois
let current = null;
let voice = null;

function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    const english = voices.filter((v) => v.lang.startsWith('en'));
    // On préfère une voix masculine grave quand le système en propose une.
    voice = english.find((v) => /male|david|daniel|george|guy|mark|fred|alex/i.test(v.name) && !/female/i.test(v.name))
        || english.find((v) => v.lang === 'en-US')
        || english[0]
        || null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

function speak(text) {
    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        if (voice) utterance.voice = voice;
        utterance.pitch = 0.4;
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn('Synthèse vocale indisponible.', e);
    }
}

/** Dit une réplique de VOICE_LINES (par son identifiant). */
export function announce(id) {
    const text = VOICE_LINES[id];
    if (!text || isMuted()) return;
    if (current) current.pause();
    if (missing.has(id)) {
        speak(text);
        return;
    }
    const audio = new Audio(`${VOICE_FOLDER}${id}.mp3`);
    current = audio;
    const fallback = () => {
        if (missing.has(id)) return;
        missing.add(id);
        if (current === audio) speak(text);
    };
    audio.addEventListener('error', fallback);
    audio.play().catch(fallback);
}

/** Texte affiché pour une manche : la 3e est la manche décisive. */
export const roundCall = (round) => (round >= 3 ? 'Final round' : `Round ${round}`);
/** Réplique de l'annonceur pour une manche. */
export const roundVoice = (round) => (round >= 3 ? 'final' : `round${round}`);
