import React, { useRef, useState } from 'react';

interface JoystickProps {
    onMove: (x: number, y: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
    const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const baseRef = useRef<HTMLDivElement>(null);
    const touchId = useRef<number | null>(null);

    const maxDistance = 50; // Maximum knob distance from center in pixels

    const handleStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsActive(true);
        touchId.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleMove = (e: React.PointerEvent) => {
        if (!isActive || !baseRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Clamp distance to maxDistance
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        const x = Math.cos(angle) * clampedDistance;
        const y = Math.sin(angle) * clampedDistance;

        setKnobPosition({ x, y });

        // Normalize to -1 to 1 range
        const normalizedX = x / maxDistance;
        const normalizedY = y / maxDistance;

        onMove(normalizedX, normalizedY);
    };

    const handleEnd = (e: React.PointerEvent) => {
        if (touchId.current === e.pointerId) {
            setIsActive(false);
            setKnobPosition({ x: 0, y: 0 });
            onMove(0, 0);
            touchId.current = null;
        }
    };

    return (
        <div
            ref={baseRef}
            className="relative w-32 h-32 rounded-full bg-stone-800/60 border-4 border-stone-600/40 backdrop-blur-sm shadow-2xl"
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            style={{ touchAction: 'none' }}
        >
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-stone-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

            {/* Draggable knob */}
            <div
                className={`absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-amber-500/80 border-3 border-amber-300 shadow-lg transition-opacity ${isActive ? 'opacity-100 scale-110' : 'opacity-70'
                    }`}
                style={{
                    transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
                    transition: isActive ? 'none' : 'transform 0.2s ease-out, opacity 0.2s, scale 0.2s',
                }}
            >
                {/* Inner glow */}
                <div className="absolute inset-2 rounded-full bg-amber-400/40" />
            </div>
        </div>
    );
};
