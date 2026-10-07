import { useEffect } from 'react';
import { useI18n } from '../i18n/context';
import { holdMusic } from '../utils/music';

// Vidéo de démonstration, dans la langue du site. La musique du site se met en pause pendant la lecture.
export default function DemoModal({ onClose }) {
    const { t, lang } = useI18n();

    useEffect(() => {
        holdMusic(true);
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            holdMusic(false);
        };
    }, [onClose]);

    return (
        <div className="modal-backdrop-mz demo-backdrop" onClick={onClose}>
            <div className="demo-card" role="dialog" aria-modal="true" aria-label={t('demo.title')} onClick={(e) => e.stopPropagation()}>
                <button type="button" className="icon-button demo-close" onClick={onClose} aria-label={t('demo.close')} title={t('demo.close')}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <video key={lang} className="demo-video" src={`${import.meta.env.BASE_URL}demo-${lang === 'en' ? 'en' : 'fr'}.mp4`} controls autoPlay playsInline />
            </div>
        </div>
    );
}
