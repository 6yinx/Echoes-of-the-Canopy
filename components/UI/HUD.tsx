
import React, { useEffect, useState } from 'react';
import { useGameStore, InventoryItem } from '../../store';
import { shallow } from 'zustand/shallow';
import { GameState } from '../../types';

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col w-48">
        <div className="flex justify-between text-amber-100 text-xs font-serif font-bold mb-1 tracking-widest uppercase shadow-black drop-shadow-md">
            <span>{label}</span>
            <span>{Math.round(value)}%</span>
        </div>
        <div className="h-3 bg-black/80 border border-amber-900/50 rounded-sm relative overflow-hidden">
            <div
                className={`h-full transition-all duration-300 ${color}`}
                style={{ width: `${value}%` }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10"></div>
        </div>
    </div>
);

const CRAFTING_RECIPES = [
    { name: 'Torch', result: 'torch', count: 1, ingredients: [{ type: 'stick', count: 2 }, { type: 'small_rock', count: 1 }] },
    { name: 'Sharp Rock', result: 'sharp_rock', count: 1, ingredients: [{ type: 'small_rock', count: 2 }] },
    { name: 'Bundle', result: 'stick_bundle', count: 1, ingredients: [{ type: 'stick', count: 3 }] },
];

const Hotbar: React.FC = () => {
    const inventory = useGameStore(state => state.inventory);
    const activeSlot = useGameStore(state => state.activeSlot);
    const setActiveSlot = useGameStore(state => state.setActiveSlot);
    const showTouchControls = useGameStore(state => state.showTouchControls);

    const slots = [0, 1, 2]; // 3 slots

    return (
        <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-stone-900/80 rounded-lg border border-stone-600 backdrop-blur-sm transition-all pointer-events-auto ${showTouchControls ? 'bottom-24' : 'bottom-6'}`}>
            {slots.map(index => {
                const item = inventory[index];
                const isActive = activeSlot === index;

                return (
                    <div
                        key={index}
                        onClick={() => setActiveSlot(index)}
                        className={`w-12 h-12 rounded border-2 flex items-center justify-center relative cursor-pointer transition-colors
                            ${isActive ? 'border-amber-500 bg-amber-900/40' : 'border-stone-700 bg-black/40 hover:border-stone-500'}
                        `}
                    >
                        {/* Slot Number Label */}
                        <span className="absolute top-0 left-1 text-[10px] text-stone-500 font-bold">{index + 1}</span>

                        {item && (
                            <>
                                <span className="text-2xl select-none">
                                    {item.type === 'stick' && '🪵'}
                                    {item.type === 'mushroom' && '🍄'}
                                    {item.type === 'small_rock' && '🪨'}
                                    {item.type === 'red_berry' && '🍒'}
                                    {item.type === 'blue_berry' && '🫐'}
                                    {item.type === 'torch' && '🔥'}
                                    {item.type === 'sharp_rock' && '🔪'}
                                    {item.type === 'stick_bundle' && '📦'}
                                </span>
                                {item.count > 1 && (
                                    <span className="absolute bottom-0 right-1 text-[10px] text-white font-bold bg-black/60 px-1 rounded">
                                        {item.count}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

const ControlsOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const toggleTouchControls = useGameStore(state => state.toggleTouchControls);
    const showTouchControls = useGameStore(state => state.showTouchControls);

    return (
        <div className="bg-stone-900 p-8 rounded border border-stone-600 text-stone-300 font-serif text-center max-w-md shadow-2xl relative z-50 pointer-events-auto">
            <h3 className="text-xl text-amber-500 mb-4">Controls</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left text-sm mb-6">
                <span>Move</span> <span className="text-white">WASD (Double Tap W to Sprint)</span>
                <span>Look</span> <span className="text-white">Mouse / Swipe</span>
                <span>Interact</span> <span className="text-white">F / Tap Object</span>
                <span>Inventory</span> <span className="text-white">E</span>
                <span>Lantern</span> <span className="text-white">Q</span>
                <span>Attack / Throw</span> <span className="text-white">Left Click</span>
                <span>Hotbar</span> <span className="text-white">1 - 3</span>
                <span>Close Menu</span> <span className="text-white">ESC</span>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4 mb-6 p-2 rounded border border-stone-800 bg-stone-950/50">
                <span className="text-xs text-stone-500 uppercase tracking-widest">Touch Controls</span>
                <button
                    onClick={toggleTouchControls}
                    className={`w-12 h-6 rounded-full relative transition-colors ${showTouchControls ? 'bg-amber-700' : 'bg-stone-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showTouchControls ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>

            <button onClick={onClose} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded border border-stone-600">
                Back
            </button>
        </div>
    )
}

const Inventory: React.FC = () => {
    const inventory = useGameStore(state => state.inventory);
    const removeFromInventory = useGameStore(state => state.removeFromInventory);
    const addToInventory = useGameStore(state => state.addToInventory);
    const addDroppedItem = useGameStore(state => state.addDroppedItem);
    const hasItem = useGameStore(state => state.hasItem);
    const setPlayerStats = useGameStore(state => state.setPlayerStats);
    const toggleInventory = useGameStore(state => state.toggleInventory);
    const hunger = useGameStore(state => state.hunger);
    const showTouchControls = useGameStore(state => state.showTouchControls);
    const slots = Array(16).fill(null);
    const [activeTab, setActiveTab] = useState<'bag' | 'craft'>('bag');

    const handleUseItem = (item: InventoryItem) => {
        if (item.type === 'mushroom' || item.type === 'red_berry' || item.type === 'blue_berry') {
            setPlayerStats({ hunger: Math.min(100, hunger + 15) });
            removeFromInventory(item.type);
        }
    }

    const handleDropItem = (e: React.MouseEvent, item: InventoryItem) => {
        e.stopPropagation();
        // Drop 1 item
        removeFromInventory(item.type, 1);

        const playerPos = useGameStore.getState().playerPosition;
        const angle = Math.random() * Math.PI * 2;
        const dist = 1.0;

        // Drop slightly in front/around player, AT GROUND LEVEL (approx 0.15)
        const dropPos: [number, number, number] = [
            playerPos[0] + Math.sin(angle) * dist,
            0.15,
            playerPos[2] + Math.cos(angle) * dist
        ];

        addDroppedItem({
            id: Math.random().toString(),
            position: dropPos,
            type: item.type
        });
    };

    const handleCraft = (recipe: any) => {
        // Check ingredients
        const canCraft = recipe.ingredients.every((ing: any) => hasItem(ing.type, ing.count));

        if (canCraft) {
            recipe.ingredients.forEach((ing: any) => {
                removeFromInventory(ing.type, ing.count);
            });
            addToInventory(recipe.result, recipe.count);
        }
    }

    // Fill slots logic for display
    const displaySlots = slots.map((_, i) => inventory[i] || null);

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-stone-900/95 p-0 rounded-lg border-2 border-amber-700 shadow-2xl w-[600px] h-[450px] pointer-events-auto flex overflow-hidden relative">
                {showTouchControls && (
                    <button
                        onClick={toggleInventory}
                        className="absolute top-2 right-2 text-stone-500 hover:text-white font-bold p-2 z-50 bg-black/20 rounded-full w-8 h-8 flex items-center justify-center"
                    >
                        ✕
                    </button>
                )}

                {/* Sidebar */}
                <div className="w-1/4 bg-stone-800/50 border-r border-amber-800 flex flex-col">
                    <button
                        onClick={() => setActiveTab('bag')}
                        className={`p-4 font-serif text-left transition-colors ${activeTab === 'bag' ? 'bg-amber-900/40 text-amber-200' : 'text-stone-500 hover:bg-stone-700'}`}
                    >
                        BACKPACK
                    </button>
                    <button
                        onClick={() => setActiveTab('craft')}
                        className={`p-4 font-serif text-left transition-colors ${activeTab === 'craft' ? 'bg-amber-900/40 text-amber-200' : 'text-stone-500 hover:bg-stone-700'}`}
                    >
                        CRAFTING
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'bag' && (
                        <>
                            <h2 className="text-amber-500 font-serif text-2xl mb-4 border-b border-amber-800 pb-2">Inventory</h2>
                            <p className="text-xs text-stone-500 mb-2">Items in the first 3 slots appear in your Hotbar.</p>
                            <div className="grid grid-cols-4 gap-3">
                                {displaySlots.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => item ? handleUseItem(item) : null}
                                        className={`aspect-square bg-black/50 border border-amber-900/40 rounded flex flex-col items-center justify-center transition-all relative group
                                        ${item ? 'hover:bg-amber-900/40 hover:scale-105 cursor-pointer active:scale-95' : 'cursor-default'}
                                        ${i < 3 ? 'ring-1 ring-amber-500/50' : ''}
                                    `}
                                        title={item ? `Click to use ${item.type}` : 'Empty Slot'}
                                    >
                                        {/* Hotbar Indicator */}
                                        {i < 3 && <span className="absolute top-1 left-1 text-[8px] text-amber-500 font-mono">{i + 1}</span>}

                                        {item && (
                                            <>
                                                <span className="text-3xl">
                                                    {item.type === 'stick' && '🪵'}
                                                    {item.type === 'mushroom' && '🍄'}
                                                    {item.type === 'small_rock' && '🪨'}
                                                    {item.type === 'red_berry' && '🍒'}
                                                    {item.type === 'blue_berry' && '🫐'}
                                                    {item.type === 'torch' && '🔥'}
                                                    {item.type === 'sharp_rock' && '🔪'}
                                                    {item.type === 'stick_bundle' && '📦'}
                                                </span>
                                                {item.count > 1 && (
                                                    <span className="absolute bottom-1 right-1 text-xs font-bold text-white bg-black/60 px-1 rounded">
                                                        {item.count}
                                                    </span>
                                                )}

                                                {/* Drop Button */}
                                                <button
                                                    onClick={(e) => handleDropItem(e, item)}
                                                    className="absolute top-1 right-1 text-stone-500 hover:text-red-400 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Drop Item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <polyline points="19 12 12 19 5 12"></polyline>
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'craft' && (
                        <>
                            <h2 className="text-amber-500 font-serif text-2xl mb-4 border-b border-amber-800 pb-2">Crafting</h2>
                            <div className="flex flex-col gap-2">
                                {CRAFTING_RECIPES.map(recipe => {
                                    const canCraft = recipe.ingredients.every((ing: any) => hasItem(ing.type, ing.count));
                                    return (
                                        <div key={recipe.name} className="flex justify-between items-center p-3 bg-black/30 rounded border border-stone-700">
                                            <div className="flex flex-col">
                                                <span className="text-amber-200 font-serif">{recipe.name}</span>
                                                <span className="text-xs text-stone-500">
                                                    {recipe.ingredients.map((i: any) => `${i.count}x ${i.type}`).join(', ')}
                                                </span>
                                            </div>
                                            <button
                                                disabled={!canCraft}
                                                onClick={() => handleCraft(recipe)}
                                                className={`px-3 py-1 text-xs rounded font-bold ${canCraft ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
                                            >
                                                CRAFT
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const LoadingScreen: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-serif text-amber-500 tracking-widest animate-pulse mb-4">LOADING WORLD</h2>
            <div className="w-64 h-1 bg-stone-800 rounded overflow-hidden">
                <div className="h-full bg-amber-600 w-full animate-[loading_2s_ease-in-out_infinite]" style={{ transformOrigin: "left" }}></div>
            </div>
            <p className="mt-4 text-stone-500 text-sm font-serif italic">Generating forest canopy...</p>
        </div>
    )
}

const WakeUpOverlay: React.FC = () => {
    const setGameState = useGameStore(state => state.setGameState);
    const showTouchControls = useGameStore(state => state.showTouchControls);
    const [lastTap, setLastTap] = useState(0);

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastTap < 400) {
            if (!showTouchControls) {
                const canvas = document.querySelector('canvas');
                // Safely request lock
                if (canvas) (canvas as any).requestPointerLock()?.catch((e: any) => { });
            }
            setGameState(GameState.PLAYING);
        }
        setLastTap(now);
    }

    return (
        <div
            className="absolute inset-0 z-[60] pointer-events-auto"
            onClick={handleInteraction}
            onTouchEnd={handleInteraction}
        >
            {/* Skip Hint */}
            <div className="absolute top-20 w-full text-center text-white/40 text-xs uppercase tracking-widest select-none">
                [Double-Tap to SKIP]
            </div>

            <div className="absolute top-0 left-0 w-full bg-black animate-[wakeUpBlinkTop_9s_ease-out_forwards]" style={{ height: '50%' }}></div>
            <div className="absolute bottom-0 left-0 w-full bg-black animate-[wakeUpBlinkBottom_9s_ease-out_forwards]" style={{ height: '50%' }}></div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes wakeUpBlinkTop {
                    0% { height: 50%; }
                    20% { height: 50%; }
                    30% { height: 20%; } 
                    40% { height: 50%; } 
                    55% { height: 10%; } 
                    65% { height: 50%; } 
                    85% { height: 0%; }  
                    100% { height: 0%; }
                }
                @keyframes wakeUpBlinkBottom {
                    0% { height: 50%; }
                    20% { height: 50%; }
                    30% { height: 20%; } 
                    40% { height: 50%; } 
                    55% { height: 10%; } 
                    65% { height: 50%; } 
                    85% { height: 0%; }  
                    100% { height: 0%; }
                }
            `}} />
        </div>
    )
}

const MobileControls: React.FC = () => {
    const setMobileInput = useGameStore(state => state.setMobileInput);
    const toggleInventory = useGameStore(state => state.toggleInventory);
    const toggleLantern = useGameStore(state => state.toggleLantern);
    const isLanternActive = useGameStore(state => state.isLanternActive);
    const inventory = useGameStore(state => state.inventory);
    const activeSlot = useGameStore(state => state.activeSlot);
    const isInventoryOpen = useGameStore(state => state.isInventoryOpen);

    const hasRock = inventory[activeSlot]?.type === 'small_rock';
    const buttonLabel = hasRock ? "THROW" : "ATTACK";

    const handleInput = (key: string, pressed: boolean) => (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMobileInput({ [key]: pressed });
    };

    return (
        <>
            <div className="absolute bottom-8 left-8 w-44 h-44 z-40 pointer-events-auto opacity-70 touch-none select-none">
                <div className="relative w-full h-full">
                    <button
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-stone-800/80 rounded-t-xl border-2 border-stone-600 active:bg-amber-700 active:border-amber-500 transition-colors"
                        onPointerDown={handleInput('forward', true)} onPointerUp={handleInput('forward', false)} onPointerLeave={handleInput('forward', false)}
                    >W</button>
                    <button
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-stone-800/80 rounded-b-xl border-2 border-stone-600 active:bg-amber-700 active:border-amber-500 transition-colors"
                        onPointerDown={handleInput('backward', true)} onPointerUp={handleInput('backward', false)} onPointerLeave={handleInput('backward', false)}
                    >S</button>
                    <button
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-stone-800/80 rounded-l-xl border-2 border-stone-600 active:bg-amber-700 active:border-amber-500 transition-colors"
                        onPointerDown={handleInput('left', true)} onPointerUp={handleInput('left', false)} onPointerLeave={handleInput('left', false)}
                    >A</button>
                    <button
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-stone-800/80 rounded-r-xl border-2 border-stone-600 active:bg-amber-700 active:border-amber-500 transition-colors"
                        onPointerDown={handleInput('right', true)} onPointerUp={handleInput('right', false)} onPointerLeave={handleInput('right', false)}
                    >D</button>
                </div>
            </div>

            <div className="absolute inset-0 z-40 pointer-events-none touch-none select-none overflow-hidden">
                <button
                    className="absolute top-[60%] right-20 transform -translate-y-1/2 w-28 h-28 rounded-full bg-amber-900/60 border-4 border-amber-500/40 flex items-center justify-center text-white font-bold active:scale-95 active:bg-amber-700/80 shadow-lg pointer-events-auto backdrop-blur-sm transition-transform"
                    onPointerDown={handleInput('throwing', true)}
                    onPointerUp={handleInput('throwing', false)}
                    onPointerLeave={handleInput('throwing', false)}
                >
                    {buttonLabel}
                </button>

                {/* Lantern toggle button */}
                <button
                    onClick={toggleLantern}
                    className={`absolute top-[40%] right-20 transform -translate-y-1/2 w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg pointer-events-auto backdrop-blur-sm transition-all ${isLanternActive
                        ? 'bg-amber-500/80 border-amber-300 text-2xl'
                        : 'bg-stone-800/60 border-stone-600/40 text-2xl'
                        }`}
                >
                    {isLanternActive ? '🔦' : '💡'}
                </button>
            </div >

            {!isInventoryOpen && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto opacity-80">
                    <button
                        className="px-8 py-3 bg-stone-800/90 border-2 border-stone-500 rounded-lg text-amber-100 font-serif text-sm active:bg-stone-700 shadow-lg"
                        onClick={toggleInventory}
                    >
                        INVENTORY
                    </button>
                </div>
            )}
        </>
    )
}


const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');

        try {
            // REPLACE 'YOUR_FORMSPREE_ID' WITH YOUR ACTUAL FORM ID FROM FORMSPREE.IO
            const response = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name || 'Anonymous',
                    message,
                    _replyto: 'cheajy6138@gmail.com' // Optional: set a reply-to if you want
                })
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(onClose, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-stone-900 border-2 border-amber-600/50 p-8 rounded-xl max-w-md w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-500 hover:text-amber-500 transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-serif text-amber-500 mb-6 text-center">Send Feedback</h2>

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">✨</div>
                        <p className="text-amber-100">Message sent successfully!</p>
                        <p className="text-stone-500 text-sm mt-2">Thank you for your feedback.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-stone-400 text-sm mb-1">Name (Optional)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors"
                                placeholder="Traveler"
                            />
                        </div>
                        <div>
                            <label className="block text-stone-400 text-sm mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                rows={4}
                                className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors resize-none"
                                placeholder="Share your thoughts..."
                            />
                        </div>

                        {status === 'error' && (
                            <p className="text-red-400 text-sm text-center">Failed to send. Please try again.</p>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="w-full bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 text-white font-bold py-3 rounded transition-colors mt-2"
                        >
                            {status === 'sending' ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const StartMenu: React.FC = () => {
    const setGameState = useGameStore(state => state.setGameState);
    const setShowIntro = useGameStore(state => state.setShowIntro);
    const loadGame = useGameStore(state => state.loadGame);
    const resetGame = useGameStore(state => state.resetGame);
    const hasSaveFile = useGameStore(state => state.hasSaveFile);

    const [showControls, setShowControls] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [hasSave, setHasSave] = useState(false);

    useEffect(() => {
        // Check for save file on mount
        setHasSave(hasSaveFile());
    }, [hasSaveFile]);

    const handleNewGame = (e: React.MouseEvent) => {
        e.preventDefault();
        resetGame();
        setTimeout(() => {
            setShowIntro(true);
            setGameState(GameState.LOADING);
        }, 50);
    }

    const handleLoadGame = (e: React.MouseEvent) => {
        e.preventDefault();
        if (loadGame()) {
            setTimeout(() => {
                setShowIntro(false);
                setGameState(GameState.LOADING);
            }, 50);
        }
    }

    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center pointer-events-auto">
            <div className="flex items-start gap-8 max-w-5xl">
                {/* Main Menu */}
                <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-7xl font-serif text-amber-500 tracking-widest drop-shadow-lg text-center leading-tight mb-2" style={{ willChange: 'transform' }}>
                            ECHOES
                        </h1>
                        <h2 className="text-3xl font-serif text-amber-700/80 tracking-widest drop-shadow-lg text-center" style={{ willChange: 'transform' }}>
                            OF THE CANOPY
                        </h2>
                    </div>

                    {!showControls ? (
                        <div className="flex flex-col gap-4 w-64">
                            <button onClick={handleNewGame} className="px-6 py-4 bg-amber-900/80 hover:bg-amber-800 border border-amber-600 text-amber-100 font-serif rounded transition-all shadow-lg">
                                NEW JOURNEY
                            </button>
                            {hasSave && (
                                <button onClick={handleLoadGame} className="px-6 py-4 bg-stone-800/80 hover:bg-stone-700 border border-stone-600 text-stone-300 font-serif rounded transition-all shadow-lg">
                                    CONTINUE
                                </button>
                            )}
                            <button onClick={() => setShowControls(true)} className="px-6 py-2 bg-transparent hover:bg-white/5 border border-stone-600 text-stone-400 font-serif rounded transition-all text-sm">
                                CONTROLS
                            </button>
                            <button
                                onClick={() => setShowFeedback(true)}
                                className="px-6 py-2 bg-transparent hover:bg-amber-900/20 border border-amber-600/40 text-amber-500/80 font-serif rounded transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <span>💬</span> FEEDBACK
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-80 bg-stone-900/90 p-6 rounded-lg border border-stone-700">
                            <h3 className="text-xl text-amber-500 font-serif mb-2 text-center">CONTROLS</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-stone-300">
                                <span>Move</span> <span className="text-right text-amber-100">WASD</span>
                                <span>Look</span> <span className="text-right text-amber-100">Mouse</span>
                                <span>Interact</span> <span className="text-right text-amber-100">F / Click</span>
                                <span>Inventory</span> <span className="text-right text-amber-100">E</span>
                                <span>Lantern</span> <span className="text-right text-amber-100">Q</span>
                                <span>Sprint</span> <span className="text-right text-amber-100">Shift / Double W</span>
                            </div>
                            <button onClick={() => setShowControls(false)} className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-sm transition-colors">
                                BACK
                            </button>
                        </div>
                    )}

                    <div className="mt-12 text-stone-500 font-serif text-sm">v0.3.0 Beta</div>
                </div>

                {/* Suggestion Panel */}
                <div className="hidden lg:block w-64 bg-stone-900/60 border border-stone-700/50 p-4 rounded-lg backdrop-blur-sm">
                    <h3 className="text-amber-600 font-serif text-sm mb-2 flex items-center gap-2">
                        <span>💡</span> TIPS
                    </h3>
                    <ul className="text-xs text-stone-400 space-y-2 leading-relaxed">
                        <li>• This world is best experienced on PC with a mouse and keyboard.</li>
                        <li>• Use headphones for the full atmospheric effect.</li>
                        <li>• If performance is low, try reducing your browser window size.</li>
                    </ul>
                </div>
            </div>

            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
        </div>
    )
}

const NotificationDisplay: React.FC = () => {
    const notification = useGameStore(state => state.notification);
    const setNotification = useGameStore(state => state.setNotification);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, setNotification]);

    if (!notification) return null;

    return (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/60 border border-amber-500/30 text-amber-100 px-6 py-2 rounded-full font-serif text-sm shadow-lg backdrop-blur-sm animate-[fadeInDown_0.3s_ease-out]">
                {notification}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    )
}

export const HUD: React.FC = () => {
    const isPaused = useGameStore(state => state.isPaused);
    const setPaused = useGameStore(state => state.setPaused);
    const isInventoryOpen = useGameStore(state => state.isInventoryOpen);
    const interactionText = useGameStore(state => state.interactionText);
    const gameState = useGameStore(state => state.gameState);
    const saveGame = useGameStore(state => state.saveGame);
    const setGameState = useGameStore(state => state.setGameState);
    const showTouchControls = useGameStore(state => state.showTouchControls);
    const health = useGameStore(state => state.health);
    const hunger = useGameStore(state => state.hunger);
    const stamina = useGameStore(state => state.stamina);
    const [showPauseControls, setShowPauseControls] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
        };
        setIsMobile(checkMobile());
    }, []);

    const displayMobileControls = (isMobile || showTouchControls) && gameState === GameState.PLAYING && !isPaused && !isInventoryOpen;

    useEffect(() => {
        if (isPaused || isInventoryOpen || gameState !== GameState.PLAYING || displayMobileControls) {
            document.exitPointerLock();
        }
    }, [isInventoryOpen, isPaused, gameState, displayMobileControls]);

    const handleResume = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).blur();
        if (!displayMobileControls && !isMobile) {
            const canvas = document.querySelector('canvas');
            // Safely request lock
            if (canvas && document.pointerLockElement !== canvas) {
                (canvas as any).requestPointerLock()?.catch((e: any) => { });
            }
        }
        setPaused(false);
        setShowPauseControls(false);
    };

    const handleSaveAndQuit = () => {
        saveGame();
        document.exitPointerLock();
        setGameState(GameState.MENU);
        setShowPauseControls(false);
    }

    if (gameState === GameState.MENU) return <StartMenu />;
    if (gameState === GameState.LOADING) return <LoadingScreen />;

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between">
            {gameState === GameState.INTRO && <WakeUpOverlay />}
            {displayMobileControls && <MobileControls />}
            <NotificationDisplay />
            {!isPaused && !isInventoryOpen && gameState === GameState.PLAYING && <Hotbar />}
            {displayMobileControls && (
                <button
                    onClick={() => setPaused(true)}
                    className="absolute top-4 right-4 w-12 h-12 bg-stone-800/80 border border-stone-500 rounded-full flex items-center justify-center text-white z-50 pointer-events-auto shadow-lg active:scale-95"
                >
                    ⚙
                </button>
            )}

            {!isPaused && !isInventoryOpen && gameState === GameState.PLAYING && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-2">
                    {!displayMobileControls && (
                        <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)] opacity-80"></div>
                    )}
                    {interactionText && (
                        <div className="text-white font-serif text-sm bg-black/50 px-2 py-1 rounded shadow animate-fade-in">
                            {interactionText}
                        </div>
                    )}
                </div>
            )}

            {isInventoryOpen && !isPaused && <Inventory />}

            {!isPaused && !isInventoryOpen && gameState === GameState.PLAYING && !displayMobileControls && (
                <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-4 bg-black/20 backdrop-blur-sm border border-amber-900/30 rounded-lg hidden md:flex">
                    <StatBar label="Health" value={health} color="bg-red-700" />
                    <StatBar label="Hunger" value={hunger} color="bg-amber-700" />
                    <StatBar label="Stamina" value={stamina} color="bg-green-700" />
                    <div className="mt-2 text-amber-100/50 text-[10px] font-serif space-y-1">
                        <p>[Q] Lantern</p>
                        <p>[E] Inventory</p>
                        <p>[F] Interact</p>
                        <p>[1-3] Hotbar</p>
                        <p>[L-Click] Use Item</p>
                    </div>
                </div>
            )}

            {(!isPaused && !isInventoryOpen && gameState === GameState.PLAYING) && (isMobile || displayMobileControls) && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 w-32 opacity-90 pointer-events-none">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-red-200 font-bold shadow-black drop-shadow-sm uppercase leading-none mb-1">Health</span>
                        <div className="h-2 bg-red-900 rounded overflow-hidden border border-black/30"><div style={{ width: `${health}%` }} className="h-full bg-red-500"></div></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-amber-200 font-bold shadow-black drop-shadow-sm uppercase leading-none mb-1">Hunger</span>
                        <div className="h-2 bg-amber-900 rounded overflow-hidden border border-black/30"><div style={{ width: `${hunger}%` }} className="h-full bg-amber-500"></div></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-green-200 font-bold shadow-black drop-shadow-sm uppercase leading-none mb-1">Stamina</span>
                        <div className="h-2 bg-green-900 rounded overflow-hidden border border-black/30"><div style={{ width: `${stamina}%` }} className="h-full bg-green-500"></div></div>
                    </div>
                </div>
            )}

            {isPaused && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto text-white z-[100]">
                    {!showPauseControls ? (
                        <div className="border-4 border-double border-amber-700 p-12 bg-stone-900 shadow-2xl rounded-lg text-center">
                            <h1 className="text-6xl font-serif mb-8 text-amber-500 tracking-widest drop-shadow-lg">PAUSED</h1>
                            <div className="flex flex-col gap-4 w-64 mx-auto">
                                <button onClick={handleResume} className="px-6 py-3 bg-amber-900 hover:bg-amber-800 border border-amber-500 rounded text-amber-100 font-serif font-bold transition-all shadow-lg hover:scale-105">RESUME</button>
                                <button onClick={() => setShowPauseControls(true)} className="px-6 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-300 font-serif font-bold transition-all shadow-lg">CONTROLS</button>
                                <button onClick={handleSaveAndQuit} className="px-6 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-300 font-serif font-bold transition-all shadow-lg">SAVE & QUIT</button>
                            </div>
                        </div>
                    ) : (
                        <ControlsOverlay onClose={() => setShowPauseControls(false)} />
                    )}
                </div>
            )}
        </div>
    );
};
