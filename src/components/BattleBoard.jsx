import { useEffect } from 'react';
import { DUEL_PEEK, MAX_HP, useBattle } from '../hooks/useBattle';
import { useI18n } from '../i18n/context';
import { roundCall } from '../utils/announcer';
import Arena from './Arena';
import Arena3D, { DuelScene3D } from './Arena3D';
import BeatDots from './BeatDots';
import Confetti from './Confetti';
import DuelScene from './DuelScene';
import Tile from './Tile';

// Touches de chaque joueur (positions physiques du clavier).
const KEYS = [
    { codes: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'], labels: ['Q', 'W', 'E', 'R', 'T'] },
    { codes: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'], labels: ['1', '2', '3', '4', '5'] },
];
const NUMPAD = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5'];
const TOTAL_ROUNDS = 3;

export default function BattleBoard({ config, players, onMatchFinished, onQuit }) {
    const { t } = useI18n();
    const battle = useBattle({ ...config, onMatchFinished });
    const { phase, question, event } = battle;
    const { equation, options } = question;
    const names = players.map((p) => p.name);
    const revealed = phase === 'resolve' || phase === 'ko';
    const { duel } = battle;
    // Qui peut répondre ? Au duel, chacun n'a qu'un essai : celui qui a raté ne peut plus rien faire.
    const cpu = Boolean(config.cpu); // le joueur de droite est joué par l'ordinateur
    const stage = battle.finisherStage; // coup final : 'charge' | 'blast' | 'done'
    const canAnswer = (player) => !(cpu && player === 1)
        && (phase === 'fight' || phase === 'duel' || (phase === 'duelFree' && duel.missed !== player));

    useEffect(() => {
        const onKey = (e) => {
            if (e.repeat || e.target.closest?.('input')) return;
            if (e.code === 'Space' && battle.cactusVisible) {
                e.preventDefault();
                battle.grabCactus();
                return;
            }
            if (phase === 'memorize') {
                if (e.key === 'Enter' && !e.target.closest?.('button')) battle.ready();
                return;
            }
            KEYS.forEach(({ codes }, player) => {
                if (cpu && player === 1) return; // l'ordinateur joue tout seul
                let index = codes.indexOf(e.code);
                if (index === -1 && player === 1) index = NUMPAD.indexOf(e.code);
                if (index !== -1 && index < options.length) {
                    e.preventDefault();
                    battle.answer(player, options[index]);
                }
            });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase, options, battle, cpu]);

    let status = t('battle.fight');
    if (stage === 'charge') status = t('battle.finisher', { name: names[battle.roundWinner] });
    else if (phase === 'memorize') status = t('battle.memorize');
    else if (phase === 'ko' && duel) status = t('duel.won', { name: names[battle.roundWinner] });
    else if (phase === 'duelIntro') status = t('duel.intro');
    else if (phase === 'duelPeek') status = t('duel.peek');
    else if (phase === 'duel') status = t('duel.draw');
    else if (phase === 'duelFree') status = t('duel.free', { loser: names[duel.missed], name: names[1 - duel.missed] });
    else if (phase === 'ko') status = t('battle.ko', { name: names[battle.roundWinner] });
    else if (phase === 'resolve' && event.type === 'hit') status = t('battle.hit', { name: names[event.player] });
    else if (phase === 'resolve' && event.type === 'counter') {
        status = t('battle.countered', { loser: names[event.player], name: names[1 - event.player] });
    }
    else if (phase === 'resolve') status = t('battle.timeout');

    return (
        <div className="panel panel-wide battle" style={{ '--p0': players[0].color, '--p1': players[1].color }}>
            <div className="board-top">
                <div className="round-info">
                    <span className="battle-pips" aria-hidden="true">
                        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
                            const winner = battle.roundResults[i];
                            if (winner !== undefined) return <span key={i} className={`pip won-${winner}`} />;
                            if (i === battle.round - 1) return <span key={i} className="pip-fire">🔥</span>;
                            return <span key={i} className="pip" />;
                        })}
                    </span>
                    <span className="round-label">{t('battle.round', { n: battle.round })}</span>
                </div>
                <BeatDots />
                <button type="button" className="icon-button" onClick={onQuit} aria-label={t('board.quit')} title={t('board.quit')}>
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <div className={`arena-wrap ${duel ? 'is-duel' : ''} ${stage ? `fin-${stage}` : ''}`}>
                {duel && config.view === '3d' && <DuelScene3D battle={battle} players={players} title={t('duel.title')} subtitle={t('duel.subtitle')} />}
                {duel && config.view !== '3d' && <DuelScene battle={battle} players={players} title={t('duel.title')} subtitle={t('duel.subtitle')} />}
                {!duel && (config.view === '3d' ? <Arena3D battle={battle} players={players} /> : <Arena battle={battle} players={players} />)}
                {/* La boule de cactus : un clic (ou Espace) lance le duel au Far West */}
                {battle.cactusVisible && (
                    <button type="button" className="cactus-ball" onClick={battle.grabCactus} aria-label={t('duel.grab')} title={t('duel.grab')}>
                        <svg viewBox="-40 -40 80 80" aria-hidden="true">
                            <g className="cactus-spikes">
                                {Array.from({ length: 14 }, (_, i) => (
                                    <line key={i} x1="0" y1="-26" x2="0" y2="-36" transform={`rotate(${i * (360 / 14)})`} />
                                ))}
                            </g>
                            <circle r="27" className="cactus-body" />
                            <path className="cactus-ribs" d="M-14 -22 C-22 -8 -22 8 -14 22 M0 -27 V27 M14 -22 C22 -8 22 8 14 22" />
                            <circle cx="9" cy="-27" r="7" className="cactus-flower" />
                        </svg>
                        <span className="cactus-hint">{t('duel.grab')}</span>
                    </button>
                )}
                {/* Grand texte de l'annonceur : manche, « Fight! », « K.O.! » */}
                {phase === 'memorize' && <div key={`r${battle.round}`} className="announce">{roundCall(battle.round)}</div>}
                {phase === 'fight' && battle.questionId === 0 && <div key={`f${battle.round}`} className="announce is-fight">Fight!</div>}
                {phase === 'duel' && <div key={`d${battle.round}`} className="announce is-fight">Draw!</div>}
                {stage === 'charge' && <div key="fin" className="announce is-super">Final blow!</div>}
                {phase === 'ko' && stage !== 'charge' && <div key={`k${battle.round}`} className="announce is-ko">{duel ? 'Bang!' : 'K.O.!'}</div>}
                {phase === 'ko' && (!stage || stage === 'done') && <Confetti key={battle.round} count={50} />}
            </div>

            <div className={`hp-row ${event.type === 'counter' ? 'is-counter' : ''}`}>
                {[0, 1].map((player) => (
                    <div key={player} className={`hp hp-${player}`}>
                        <div className="hp-head">
                            <span className="hp-name">{names[player]}</span>
                            <span className="hp-wins" aria-label={t('battle.wins', { n: battle.wins[player] })}>
                                {[0, 1].map((i) => <span key={i} className={i < battle.wins[player] ? 'on' : ''} />)}
                            </span>
                        </div>
                        <div
                            className="hp-track"
                            role="meter"
                            aria-label={t('battle.hp', { name: names[player] })}
                            aria-valuemin={0}
                            aria-valuemax={MAX_HP}
                            aria-valuenow={battle.hp[player]}
                        >
                            <div className={`hp-fill ${battle.hp[player] <= 34 ? 'is-low' : ''}`} style={{ width: `${battle.hp[player]}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <p className={`battle-status is-${phase}`} aria-live="polite">{status}</p>

            <div className="sequence battle-sequence" key={`${battle.round}-${duel ? 'duel' : 'ring'}`}>
                {battle.sequence.map((item, index) => {
                    const isAnswer = revealed && index + 1 === equation.answerPosition;
                    return (
                        <Tile
                            key={index}
                            item={item}
                            position={index + 1}
                            hidden={phase !== 'memorize' && phase !== 'duelPeek' && !isAnswer}
                            highlight={isAnswer}
                            label={t('board.pos', { n: index + 1 })}
                            hiddenLabel={t('board.hidden', { n: index + 1 })}
                        />
                    );
                })}
            </div>

            {phase === 'duelPeek' && (
                <div className="memorize-foot">
                    <div className="timer" aria-hidden="true">
                        <div className="timer-track">
                            <div className="timer-fill is-draining" style={{ animationDuration: `${DUEL_PEEK}s` }} />
                        </div>
                    </div>
                </div>
            )}
            {phase === 'duelIntro' || phase === 'duelPeek' ? null : phase === 'memorize' ? (
                <div className="memorize-foot">
                    <div className="timer" role="timer" aria-live="off">
                        <div className="timer-track">
                            <div className="timer-fill" style={{ width: `${(battle.countdown / battle.seconds) * 100}%` }} />
                        </div>
                        <span className="timer-label">{t('board.timeLeft', { s: battle.countdown })}</span>
                    </div>
                    <button type="button" className="btn-mz btn-mz-ink" onClick={battle.ready}>
                        {t('battle.ready')}
                    </button>
                </div>
            ) : (
                <div className="battle-question">
                    <div className="eq-tiles" aria-label={`${equation.item} ${equation.op} ${equation.value}`}>
                        <span className="eq-tile">{equation.item}</span>
                        <span className="eq-sign">{equation.op === '+' ? '+' : '−'}</span>
                        <span className="eq-tile">{equation.value}</span>
                        <span className="eq-sign">=</span>
                        <span className={`eq-tile ${revealed ? 'is-solved' : 'is-unknown'}`}>{revealed ? equation.answer : '?'}</span>
                    </div>
                    <div className="eq-clock" aria-hidden="true">
                        <div
                            key={battle.questionId}
                            className={`eq-clock-fill ${revealed || duel ? 'is-paused' : ''}`}
                            style={{ animationDuration: `${battle.equationSeconds}s` }}
                        />
                    </div>

                    <div className="pads">
                        {[0, 1].map((player) => (
                            <div key={player} className={`pad pad-${player}`}>
                                <p className="pad-name">
                                    {names[player]}
                                    {cpu && player === 1 && <span className="pad-cpu">{t('battle.cpuPlays')}</span>}
                                </p>
                                <div className="pad-keys">
                                    {options.map((opt, index) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            className={`pad-key ${revealed && opt === equation.answer ? 'is-right' : ''} ${battle.pending?.player === player && battle.pending.option === opt ? 'is-picked' : ''}`}
                                            onClick={() => battle.answer(player, opt)}
                                            disabled={!canAnswer(player)}
                                        >
                                            <span className="pad-value">{opt}</span>
                                            <span className="pad-hint" aria-hidden="true">{KEYS[player].labels[index]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
