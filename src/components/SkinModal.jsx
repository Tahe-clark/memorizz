import { useEffect } from 'react';
import { useI18n } from '../i18n/context';
import PlayerEditor from './PlayerEditor';

// Fenêtre « Personnaliser » de l'accueil : le joueur règle son skin (avatar,
// couleur, accessoire, gants, danse). C'est le même que le joueur 1 de Battle et
// l'aventurier d'Escape. Plus tard, la boutique ajoutera ici les skins achetés.
export default function SkinModal({ player, onChange, onClose }) {
    const { t } = useI18n();

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="modal-backdrop-mz" onClick={onClose}>
            <div className="skin-modal" role="dialog" aria-modal="true" aria-label={t('home.skin.customize')} onClick={(e) => e.stopPropagation()}>
                <div className="skin-modal-head">
                    <h2>{t('home.skin.customize')}</h2>
                    <button type="button" className="icon-button" onClick={onClose} aria-label={t('demo.close')} title={t('demo.close')}>
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>
                <PlayerEditor index={0} player={player} onChange={onChange} />
                <button type="button" className="btn-mz btn-mz-sun w-100 mt-3" onClick={onClose}>{t('home.skin.done')}</button>
            </div>
        </div>
    );
}
