import { useCallback, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage';
import { LanguageContext } from './context';
import { DICTIONARY, LANGUAGES } from './translations';

function detectLanguage() {
    const saved = readStorage('lang');
    if (LANGUAGES.includes(saved)) return saved;
    const browser = (navigator.language || 'fr').slice(0, 2);
    return browser === 'en' ? 'en' : 'fr';
}

export default function LanguageProvider({ children }) {
    const [lang, setLang] = useState(detectLanguage);

    useEffect(() => {
        writeStorage('lang', lang);
        document.documentElement.lang = lang;
        document.title = DICTIONARY[lang]['meta.title'];
    }, [lang]);

    const t = useCallback((key, vars = {}) => {
        const text = DICTIONARY[lang][key] ?? DICTIONARY.fr[key] ?? key;
        return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
    }, [lang]);

    const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
