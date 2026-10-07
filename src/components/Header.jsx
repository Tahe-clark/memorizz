import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { LANGUAGES } from '../i18n/translations';
import { isMuted, setMuted } from '../utils/audio';
import { isMusicEnabled, setMusicEnabled } from '../utils/music';
import { getTheme, setTheme } from '../utils/theme';

export function Logo() {
    return (
        <span className="logo" aria-label="MEM’ORIZZ">
            <span aria-hidden="true">MEM’</span>
            <span className="logo-frame" aria-hidden="true">🧠</span>
            <span aria-hidden="true">RIZZ</span>
        </span>
    );
}

export default function Header({ onHome, onOpenLogin }) {
    const { lang, setLang, t } = useI18n();
    const [muted, setMutedState] = useState(isMuted);

    const [music, setMusicState] = useState(isMusicEnabled);

    const [theme, setThemeState] = useState(getTheme);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
    };

    const toggleMusic = () => {
        setMusicEnabled(!music);
        setMusicState(!music);
    };

    const toggleSound = () => {
        setMuted(!muted);
        setMutedState(!muted);
    };

    return (
        <header className="site-header">
            <div className="container header-inner">
                <button type="button" className="logo-button" onClick={onHome} title={t('nav.home')}>
                    <Logo />
                </button>

                <div className="header-actions">
                    <div className="lang-switch" role="group" aria-label={t('nav.language')}>
                        {LANGUAGES.map((code) => (
                            <button
                                key={code}
                                type="button"
                                className={lang === code ? 'is-active' : ''}
                                aria-pressed={lang === code}
                                onClick={() => setLang(code)}
                            >
                                {code.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="icon-button"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
                        title={theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
                    >
                        <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
                    </button>

                    <button
                        type="button"
                        className={`icon-button ${music ? '' : 'is-off'}`}
                        onClick={toggleMusic}
                        aria-pressed={music}
                        aria-label={music ? t('nav.musicOn') : t('nav.musicOff')}
                        title={music ? t('nav.musicOn') : t('nav.musicOff')}
                    >
                        <i className="fa-solid fa-music" aria-hidden="true"></i>
                    </button>

                    <button
                        type="button"
                        className="icon-button"
                        onClick={toggleSound}
                        aria-label={muted ? t('nav.soundOff') : t('nav.soundOn')}
                        title={muted ? t('nav.soundOff') : t('nav.soundOn')}
                    >
                        <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} aria-hidden="true"></i>
                    </button>

                    <button type="button" className="btn-mz btn-mz-small" onClick={onOpenLogin}>
                        <i className="fa-regular fa-user" aria-hidden="true"></i>
                        <span className="d-none d-sm-inline">{t('nav.login')}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
