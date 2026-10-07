import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import LanguageProvider from './i18n/LanguageProvider';
import { BEAT_MS } from './utils/music';
import { applyTheme, getTheme } from './utils/theme';

// Thème appliqué avant le premier affichage (pas de flash clair en mode sombre).
applyTheme(getTheme());
// Durée d'un temps de la musique : les animations des personnages s'en servent pour danser en rythme.
document.documentElement.style.setProperty('--beat', `${BEAT_MS}ms`);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LanguageProvider>
            <App />
        </LanguageProvider>
    </StrictMode>,
);
