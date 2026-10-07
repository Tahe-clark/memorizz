import { ACCESSORIES, AVATAR_COLORS, AVATAR_IDS, EMOTES, GLOVE_COLORS } from '../data/avatars';
import { useI18n } from '../i18n/context';
import { AvatarFigure } from './Avatar';

// Carte de réglage d'un joueur : nom, choix de l'avatar, puis personnalisation
// (couleur et accessoire), avec un aperçu qui se met à jour en direct.
export default function PlayerEditor({ index, player, cpu = false, onChange }) {
    const { t } = useI18n();
    const set = (field, value) => onChange({ ...player, [field]: value });
    const label = cpu ? t('config.cpuName') : t('config.playerDefault', { n: index + 1 });

    return (
        <fieldset className="player-card">
            <legend className="visually-hidden">{label}</legend>
            <div className="player-top">
                {/* L'aperçu rejoue l'emote choisie à chaque changement */}
                <div className="player-preview">
                    <AvatarFigure key={player.emote} player={player} mood="happy" flip={index === 1} className={`is-emoting is-once emote-${player.emote}`} />
                </div>
                <label className="name-field">
                    <span className="name-keys">{cpu ? t('config.cpuKeys') : t(`config.keys${index}`)}</span>
                    <input
                        type="text"
                        maxLength={12}
                        value={player.name}
                        placeholder={label}
                        aria-label={label}
                        onChange={(e) => set('name', e.target.value)}
                    />
                </label>
            </div>

            <p className="player-label">{t('config.avatar')}</p>
            <div className="avatar-picks" role="radiogroup" aria-label={t('config.avatar')}>
                {AVATAR_IDS.map((id) => (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={player.avatar === id}
                        aria-label={t(`avatar.${id}`)}
                        title={t(`avatar.${id}`)}
                        className={`avatar-pick ${player.avatar === id ? 'is-active' : ''}`}
                        onClick={() => set('avatar', id)}
                    >
                        <AvatarFigure player={{ ...player, avatar: id }} />
                    </button>
                ))}
            </div>

            {/* La personnalisation détaillée reste repliée pour garder l'écran léger */}
            <details className="player-more">
                <summary>{t('config.customize')}</summary>
                <div className="player-more-grid">
                    <p className="player-label">{t('config.color')}</p>
                    <div className="swatches" role="radiogroup" aria-label={t('config.color')}>
                        {AVATAR_COLORS.map((color, i) => (
                            <button
                                key={color}
                                type="button"
                                role="radio"
                                aria-checked={player.color === color}
                                aria-label={t('config.colorN', { n: i + 1 })}
                                className={`swatch ${player.color === color ? 'is-active' : ''}`}
                                style={{ background: color }}
                                onClick={() => set('color', color)}
                            />
                        ))}
                    </div>

                    <p className="player-label">{t('config.accessory')}</p>
                    <div className="chips" role="radiogroup" aria-label={t('config.accessory')}>
                        {ACCESSORIES.map((id) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={player.accessory === id}
                                className={`chip ${player.accessory === id ? 'is-active' : ''}`}
                                onClick={() => set('accessory', id)}
                            >
                                {t(`accessory.${id}`)}
                            </button>
                        ))}
                    </div>

                    <p className="player-label">{t('config.gloves')}</p>
                    <div className="swatches" role="radiogroup" aria-label={t('config.gloves')}>
                        {GLOVE_COLORS.map((color, i) => (
                            <button
                                key={color}
                                type="button"
                                role="radio"
                                aria-checked={player.gloves === color}
                                aria-label={t('config.colorN', { n: i + 1 })}
                                className={`swatch ${player.gloves === color ? 'is-active' : ''}`}
                                style={{ background: color }}
                                onClick={() => set('gloves', color)}
                            />
                        ))}
                    </div>

                    <p className="player-label">{t('config.emote')}</p>
                    <div className="chips" role="radiogroup" aria-label={t('config.emote')}>
                        {EMOTES.map((id) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={player.emote === id}
                                className={`chip ${player.emote === id ? 'is-active' : ''}`}
                                onClick={() => set('emote', id)}
                            >
                                {t(`emote.${id}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </details>
        </fieldset>
    );
}
