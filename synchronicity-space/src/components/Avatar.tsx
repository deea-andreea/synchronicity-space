import React, { useState, useEffect } from 'react';
import './Avatar.css';

const girlFrames = [
  'image 40.svg', 'image 42.svg', 'image 43.svg', 'image 44.svg',
  'image 45.svg', 'image 46.svg', 'image 47.svg', 'image 49.svg',
  'image 50.svg', 'image 51.svg', 'image 52.svg', 'image 53.svg'
];

const boyFrames = [
  'image 41.svg', 'image 54.svg', 'image 55.svg', 'image 56.svg',
  'image 57.svg', 'image 58.svg', 'image 59.svg', 'image 60.svg',
  'image 61.svg', 'image 62.svg', 'image 63.svg', 'image 64.svg'
];

export default function Avatar({ type, name, targetX, targetY, isMe }: { type: 'boy' | 'girl', name: string, targetX: number, targetY: number, isMe: boolean }) {
  // Use initial target position or center bottom
  const [pos, setPos] = useState({ x: targetX || window.innerWidth / 2, y: targetY || window.innerHeight - 100 });
  const [frameIdx, setFrameIdx] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [scaleX, setScaleX] = useState(1);

  const frames = type === 'girl' ? girlFrames : boyFrames;

  useEffect(() => {
    let interval: any;
    if (isWalking) {
      interval = setInterval(() => {
        setFrameIdx((prev) => (prev + 1) % frames.length);
      }, 100);
    } else {
      setFrameIdx(0);
    }
    return () => clearInterval(interval);
  }, [isWalking, frames.length]);

  useEffect(() => {
    if (!targetX || !targetY) return;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      if (isWalking) setIsWalking(false);
      return;
    }

    if (!isWalking) setIsWalking(true);
    if (dx < 0 && scaleX !== -1) setScaleX(-1);
    else if (dx > 0 && scaleX !== 1) setScaleX(1);

    const speed = 4;
    const ratio = speed / dist;

    const timeout = setTimeout(() => {
      setPos({
        x: pos.x + dx * ratio,
        y: pos.y + dy * ratio
      });
    }, 16);

    return () => clearTimeout(timeout);
  }, [targetX, targetY, pos, isWalking, scaleX]);

  const screenH = window.innerHeight || 800;
  const minY = screenH * 0.4;
  const depthRatio = Math.max(0, Math.min(1, (pos.y - minY) / (screenH - minY)));
  const minScale = 0.4;
  const maxScale = 1.0;
  const scale = minScale + depthRatio * (maxScale - minScale);

  return (
    <div 
      className={`avatar-container ${isMe ? 'is-me' : ''}`}
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -100%) scale(${scale})`,
        zIndex: Math.floor(pos.y)
      }}
    >
      <div className="avatar-name">{name}</div>
      <img 
        src={`/${type}/${frames[frameIdx]}`} 
        style={{ transform: `scaleX(${scaleX})` }}
        alt="avatar" 
      />
    </div>
  );
}
