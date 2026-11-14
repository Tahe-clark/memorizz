import { lazy, Suspense, useState } from 'react';
import { useI18n } from '../i18n/context';
import { hasWebGL } from '../utils/webgl';
import { AvatarFigure } from './Avatar';
import Locker from './Locker';

// Carte d'un joueur dans les réglages de Battle : son personnage en 3D (on peut
// le faire tourner), son nom, ses touches, et « Personnaliser » qui ouvre le
// casier en plein écran pour ce joueur.
const LockerStage = lazy(() => import('../three/Locker3D'));

export default function PlayerCard3D({ index, player, cpu = false, onChange }) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [danceTick, setDanceTick] = useState(0);
    const [noWebGL, setNoWebGL] = useState(() => !hasWebGL());
    const label = cpu ? t('config.cpuName') : t('config.playerDefault', { n: index + 1 });
    const fallback = <div className="pc3d-fallback"><AvatarFigure player={player} mood="happy" flip={index === 1} /></div>;

    return (
        <div className={`pc3d is-p${index}`}>
            <div className="pc3d-head">
                <span className="pc3d-tag">{label}</span>
                <span className="pc3d-keys">{cpu ? t('config.cpuKeys') : t(`config.keys${index}`)}</span>
            </div>
            <div className="pc3d-stage" onDoubleClick={() => setDanceTick((n) => n + 1)}>
                {noWebGL ? fallback : (
                    <Suspense fallback={fallback}>
                        <LockerStage player={player} danceTick={danceTick} onFail={() => setNoWebGL(true)} />
                    </Suspense>
                )}
            </div>
            <input className="pc3d-name" type="text" maxLength={12} value={player.name} placeholder={label} aria-label={label} onChange={(e) => onChange({ ...player, name: e.target.value })} />
            <div className="pc3d-actions">
                <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={() => setDanceTick((n) => n + 1)}>
                    <i className="fa-solid fa-music" aria-hidden="true"></i> {t('locker.dance')}
                </button>
                <button type="button" className="btn-c btn-c-accent btn-c-sm" onClick={() => setOpen(true)}>
                    <i className="fa-solid fa-shirt" aria-hidden="true"></i> {t('home.skin.customize')}
                </button>
            </div>
            {open && (
                <Locker
                    overlay
                    kicker={t('locker.title')}
                    title={player.name || label}
                    namePlaceholder={label}
                    player={player}
                    onSave={(p) => { onChange(p); setOpen(false); }}
                    onBack={() => setOpen(false)}
                />
            )}
        </div>
    );
}
