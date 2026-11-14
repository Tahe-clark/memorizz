import { lazy, Suspense, useEffect, useState } from 'react';
import { ACCESSORIES, AVATAR_COLORS, AVATAR_IDS, BACK_ITEMS, EMOTES, GLOVE_COLORS } from '../data/avatars';
import { useI18n } from '../i18n/context';
import { hasWebGL } from '../utils/webgl';
import { AvatarFigure } from './Avatar';

// Le casier, façon Fortnite : une page entière pour habiller son personnage.
// À gauche les catégories, au centre le personnage en grand (en 3D, on le fait
// tourner en le glissant), à droite les objets de la catégorie avec leur vignette.
// Plus tard, les objets achetés dans la boutique s'ajouteront ici.

const LockerStage = lazy(() => import('../three/Locker3D'));

const CATEGORIES = [
    { id: 'body', icon: 'fa-user', field: 'avatar' },
    { id: 'color', icon: 'fa-palette', field: 'color' },
    { id: 'head', icon: 'fa-hat-wizard', field: 'accessory' },
    { id: 'back', icon: 'fa-shield-halved', field: 'back' },
    { id: 'gloves', icon: 'fa-hand-fist', field: 'gloves' },
    { id: 'dance', icon: 'fa-music', field: 'emote' },
];

const DANCE_ICONS = { jump: 'fa-arrow-up', spin: 'fa-rotate', wiggle: 'fa-wave-square', pump: 'fa-hand-fist', flip: 'fa-arrows-rotate', wave: 'fa-hand', robot: 'fa-robot', dab: 'fa-person-running' };

export default function Locker({ player, onSave, onBack, overlay = false, title = null, kicker = null, namePlaceholder = null }) {
    const { t } = useI18n();
    const [draft, setDraft] = useState(player);
    const [cat, setCat] = useState('body');
    const [danceTick, setDanceTick] = useState(0);
    const [thumbs, setThumbs] = useState({});
    const [noWebGL, setNoWebGL] = useState(() => !hasWebGL());
    const category = CATEGORIES.find((c) => c.id === cat);
    const changed = JSON.stringify(draft) !== JSON.stringify(player);

    const set = (field, value) => {
        setDraft((d) => ({ ...d, [field]: value }));
        if (field === 'emote') setDanceTick((n) => n + 1);
    };

    // Vignettes 3D des objets, avec la couleur et le corps actuels du personnage
    const thumbView = { body: 'body', head: 'head', back: 'back' }[cat];
    const thumbBase = `${draft.avatar}|${draft.color}|${draft.gloves}|${draft.accessory}|${draft.back}`;
    useEffect(() => {
        if (!thumbView || noWebGL) return undefined;
        let cancelled = false;
        const ids = { body: AVATAR_IDS, head: ACCESSORIES, back: BACK_ITEMS }[cat];
        const field = category.field;
        const items = ids.map((id) => ({ key: `${cat}:${id}:${field === 'avatar' ? '' : draft.avatar}:${draft.color}`, player: { ...draft, [field]: id, ...(cat === 'head' ? { back: 'none' } : {}) }, view: thumbView }))
            .filter((item) => !thumbs[item.key]);
        if (!items.length) return undefined;
        import('../three/thumbs').then(({ renderThumbs }) => renderThumbs(items)).then((made) => {
            if (!cancelled) setThumbs((old) => ({ ...old, ...made }));
        }).catch(() => {});
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcule quand la catégorie ou le skin change
    }, [cat, thumbBase, noWebGL]);

    const thumbKey = (id) => `${cat}:${id}:${category.field === 'avatar' ? '' : draft.avatar}:${draft.color}`;

    let items;
    if (cat === 'color' || cat === 'gloves') {
        const palette = cat === 'color' ? AVATAR_COLORS : GLOVE_COLORS;
        const value = draft[category.field];
        items = (
            <div className="locker-swatches">
                {palette.map((color) => (
                    <button key={color} type="button" className={`locker-swatch ${value === color ? 'is-on' : ''}`} style={{ '--c': color }} aria-label={color} aria-pressed={value === color} onClick={() => set(category.field, color)} />
                ))}
                {/* Couleur personnalisée, n'importe laquelle */}
                <label className={`locker-swatch is-custom ${palette.includes(value) ? '' : 'is-on'}`} style={{ '--c': palette.includes(value) ? 'transparent' : value }} title={t('locker.custom')}>
                    <input type="color" value={value} onChange={(e) => set(category.field, e.target.value)} aria-label={t('locker.custom')} />
                    <i className="fa-solid fa-eye-dropper" aria-hidden="true"></i>
                </label>
            </div>
        );
    } else if (cat === 'dance') {
        items = (
            <div className="locker-grid">
                {EMOTES.map((id) => (
                    <button key={id} type="button" className={`locker-item is-dance ${draft.emote === id ? 'is-on' : ''}`} aria-pressed={draft.emote === id} onClick={() => set('emote', id)}>
                        <span className="locker-thumb"><i className={`fa-solid ${DANCE_ICONS[id]}`} aria-hidden="true"></i></span>
                        <span className="locker-name">{t(`emote.${id}`)}</span>
                    </button>
                ))}
            </div>
        );
    } else {
        const ids = { body: AVATAR_IDS, head: ACCESSORIES, back: BACK_ITEMS }[cat];
        const labelKey = { body: 'avatar', head: 'accessory', back: 'back' }[cat];
        items = (
            <div className="locker-grid">
                {ids.map((id) => {
                    const on = draft[category.field] === id;
                    const src = thumbs[thumbKey(id)];
                    return (
                        <button key={id} type="button" className={`locker-item ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => set(category.field, id)}>
                            <span className="locker-thumb">
                                {id === 'none' ? <i className="fa-solid fa-ban" aria-hidden="true"></i> : src ? <img src={src} alt="" /> : <span className="locker-loading" />}
                            </span>
                            <span className="locker-name">{t(`${labelKey}.${id}`)}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`locker ${overlay ? 'is-overlay' : ''}`} role={overlay ? 'dialog' : undefined} aria-modal={overlay || undefined}>
            <div className="locker-top">
                <button type="button" className="icon-button" onClick={onBack} aria-label={t('config.back')} title={t('config.back')}>
                    <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                </button>
                <div>
                    <small className="locker-kicker">{kicker ?? t('locker.kicker')}</small>
                    <h1 className="locker-title">{title ?? t('locker.title')}</h1>
                </div>
                <div className="locker-actions">
                    {changed && <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={() => setDraft(player)}>{t('locker.reset')}</button>}
                    <button type="button" className="btn-c btn-c-light" onClick={() => onSave(draft)} disabled={!changed}>
                        <i className="fa-solid fa-check" aria-hidden="true"></i> {changed ? t('locker.save') : t('locker.saved')}
                    </button>
                </div>
            </div>

            <div className="locker-body">
                {/* Catégories */}
                <nav className="locker-cats" aria-label={t('locker.title')}>
                    {CATEGORIES.map((c) => (
                        <button key={c.id} type="button" className={cat === c.id ? 'is-on' : ''} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                            <i className={`fa-solid ${c.icon}`} aria-hidden="true"></i>
                            <span>{t(`locker.cat.${c.id}`)}</span>
                        </button>
                    ))}
                </nav>

                {/* Le personnage en grand */}
                <div className="locker-preview">
                    <div className="locker-spot" aria-hidden="true" />
                    {noWebGL ? (
                        <div className="locker-fallback"><AvatarFigure player={draft} mood="happy" /></div>
                    ) : (
                        <Suspense fallback={<div className="locker-fallback"><AvatarFigure player={draft} mood="happy" /></div>}>
                            <LockerStage player={draft} danceTick={danceTick} onFail={() => setNoWebGL(true)} />
                        </Suspense>
                    )}
                    <div className="locker-preview-bar">
                        <input className="locker-name-input" type="text" maxLength={12} value={draft.name} placeholder={namePlaceholder ?? t('config.playerDefault', { n: 1 })} aria-label={t('locker.name')} onChange={(e) => set('name', e.target.value)} />
                        <button type="button" className="btn-c btn-c-glass btn-c-sm" onClick={() => setDanceTick((n) => n + 1)}>
                            <i className="fa-solid fa-music" aria-hidden="true"></i> {t('locker.dance')}
                        </button>
                    </div>
                    <p className="locker-hint">{t('locker.hint')}</p>
                </div>

                {/* Les objets de la catégorie */}
                <section className="locker-panel" aria-labelledby="locker-cat-title">
                    <h2 id="locker-cat-title">{t(`locker.cat.${cat}`)}</h2>
                    {items}
                </section>
            </div>
        </div>
    );
}
