import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { LANGUAGES } from '../i18n/translations';
import { isMuted, setMuted } from '../utils/audio';
import { isMusicEnabled, setMusicEnabled } from '../utils/music';

// Logo : la carte du jeu avec le cerveau (elle se retourne au survol), puis le nom.
export function Logo() {
    return (
        <span className="logo" aria-label="Memorizz">
            <span className="logo-card" aria-hidden="true">
                <span className="logo-card-face">🧠</span>
                <span className="logo-card-back">?</span>
            </span>
            <span className="logo-word" aria-hidden="true">memori<span className="logo-zz">zz</span></span>
        </span>
    );
}

// Barre de navigation flottante : logo, onglets (avec icônes), langue, musique, sons, connexion.
export default function Header({ onHome, onOpenLogin, onOpenLocker, overlay = false, current = 'home' }) {
    const { lang, setLang, t } = useI18n();
    const [muted, setMutedState] = useState(isMuted);
    const [music, setMusicState] = useState(isMusicEnabled);

    const toggleMusic = () => {
        setMusicEnabled(!music);
        setMusicState(!music);
    };
    const toggleSound = () => {
        setMuted(!muted);
        setMutedState(!muted);
    };
    const goGames = () => {
        onHome();
        setTimeout(() => document.getElementById('jeux')?.scrollIntoView({ behavior: 'smooth' }), 60);
    };
    const tabs = [
        { id: 'home', icon: 'fa-house', label: t('nav.homeLink'), onClick: onHome, active: overlay },
        { id: 'games', icon: 'fa-gamepad', label: t('nav.games'), onClick: goGames },
        { id: 'locker', icon: 'fa-shirt', label: t('nav.locker'), onClick: onOpenLocker, active: current === 'locker' },
        { id: 'shop', icon: 'fa-bag-shopping', label: t('nav.shop'), soon: true },
        { id: 'friends', icon: 'fa-user-group', label: t('nav.friends'), soon: true },
    ];

    return (
        <header className={`site-header ${overlay ? 'is-overlay' : ''}`}>
            <div className="nav-bar">
                <button type="button" className="logo-button" onClick={onHome} title={t('nav.home')}>
                    <Logo />
                </button>

                <nav className="nav-tabs" aria-label={t('nav.main')}>
                    {tabs.map((tab) => (tab.soon ? (
                        <span key={tab.id} className="nav-tab is-soon" title={t('home.soon')}>
                            <i className={`fa-solid ${tab.icon}`} aria-hidden="true"></i>
                            <span>{tab.label}</span>
                            <i className="fa-solid fa-lock nav-lock" aria-hidden="true"></i>
                        </span>
                    ) : (
                        <button key={tab.id} type="button" className={`nav-tab ${tab.active ? 'is-active' : ''}`} aria-current={tab.active ? 'page' : undefined} onClick={tab.onClick}>
                            <i className={`fa-solid ${tab.icon}`} aria-hidden="true"></i>
                            <span>{tab.label}</span>
                        </button>
                    )))}
                </nav>

                <div className="nav-actions">
                    <div className="nav-lang" role="group" aria-label={t('nav.language')}>
                        {LANGUAGES.map((code) => (
                            <button key={code} type="button" className={lang === code ? 'is-active' : ''} aria-pressed={lang === code} onClick={() => setLang(code)}>
                                {code.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button type="button" className={`nav-icon ${music ? '' : 'is-off'}`} onClick={toggleMusic} aria-pressed={music} aria-label={music ? t('nav.musicOn') : t('nav.musicOff')} title={music ? t('nav.musicOn') : t('nav.musicOff')}>
                        <i className="fa-solid fa-music" aria-hidden="true"></i>
                    </button>
                    <button type="button" className={`nav-icon ${muted ? 'is-off' : ''}`} onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? t('nav.soundOff') : t('nav.soundOn')} title={muted ? t('nav.soundOff') : t('nav.soundOn')}>
                        <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} aria-hidden="true"></i>
                    </button>
                    <button type="button" className="nav-login" onClick={onOpenLogin}>
                        <i className="fa-regular fa-user" aria-hidden="true"></i>
                        <span>{t('nav.login')}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
