import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/context';

export default function LoginModal({ onClose }) {
    const { t } = useI18n();
    const buttonRef = useRef(null);

    useEffect(() => {
        buttonRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="modal-backdrop-mz" onClick={onClose}>
            <div
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="modal-icon" aria-hidden="true">🐣</span>
                <h2 id="login-title" className="h-section">{t('modal.title')}</h2>
                <p className="text-soft">{t('modal.body')}</p>
                <button ref={buttonRef} type="button" className="btn-mz btn-mz-ink w-100" onClick={onClose}>
                    {t('modal.ok')}
                </button>
            </div>
        </div>
    );
}
