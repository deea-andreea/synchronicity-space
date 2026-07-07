import React, { useState, useEffect, useRef } from 'react';
import './Avatar.css';

const girlFrames = [
  'front_idle.svg', 'front_walk1.svg', 'front_walk2.svg', // down
  'left_idle.svg', 'left_walk1.svg', 'left_walk2.svg',    // left
  'right_idle.svg', 'right_walk1.svg', 'right_walk2.svg', // right
  'back_idle.svg', 'back_walk1.svg', 'back_walk2.svg'     // up
];

const boyFrames = [
  'front_idle.svg', 'front_walk1.svg', 'front_walk2.svg', // down
  'left_idle.svg', 'left_walk1.svg', 'left_walk2.svg',    // left
  'right_idlw.svg', 'right_walk1.svg', 'right_walk2.svg', // right
  'back_idle.svg', 'back_walk1.svg', 'back_walk2.svg'     // up
];

export default function Avatar({ type, name, targetX, targetY, isMe, targetDirection, targetIsWalking, onMove }: { 
  type: 'boy' | 'girl', name: string, targetX: number, targetY: number, isMe: boolean, 
  targetDirection?: string, targetIsWalking?: boolean, onMove?: (x: number, y: number, dir: string, walk: boolean) => void 
}) {
  const [pos, setPos] = useState({ x: targetX || window.innerWidth / 2, y: targetY || window.innerHeight - 100 });
  const [frameIdx, setFrameIdx] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState<'down'|'left'|'right'|'up'>('down');

  const frames = type === 'girl' ? girlFrames : boyFrames;
  
  const getFramesForDir = (dir: string) => {
    switch(dir) {
      case 'down': return frames.slice(0, 3);
      case 'left': return frames.slice(3, 6);
      case 'right': return frames.slice(6, 9);
      case 'up': return frames.slice(9, 12);
      default: return frames.slice(0, 3);
    }
  };

  const currentFrames = getFramesForDir(direction);
  
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    let interval: any;
    if (isWalking) {
      interval = setInterval(() => {
        setFrameIdx((prev) => (prev + 1) % currentFrames.length);
      }, 150);
    } else {
      setFrameIdx(0);
    }
    return () => clearInterval(interval);
  }, [isWalking, currentFrames.length]);

  // Handle remote updates for other users
  useEffect(() => {
    if (isMe) return;
    setPos({ x: targetX, y: targetY });
    if (targetDirection) setDirection(targetDirection as any);
    if (targetIsWalking !== undefined) setIsWalking(targetIsWalking);
  }, [targetX, targetY, targetDirection, targetIsWalking, isMe]);

  // Handle local keyboard movement
  useEffect(() => {
    if (!isMe) return;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const speed = 4;
    let frameId: number;
    let lastEmitTime = 0;
    
    let currentDir = 'down';
    let currentIsWalking = false;

    const update = () => {
      let dx = 0, dy = 0;
      let newDir = currentDir;
      if (keys['ArrowUp'] || keys['w']) { dy -= speed; newDir = 'up'; }
      if (keys['ArrowDown'] || keys['s']) { dy += speed; newDir = 'down'; }
      if (keys['ArrowLeft'] || keys['a']) { dx -= speed; newDir = 'left'; }
      if (keys['ArrowRight'] || keys['d']) { dx += speed; newDir = 'right'; }
      
      const isWalk = (dx !== 0 || dy !== 0);

      setPos(p => {
        let nx = p.x + dx;
        let ny = p.y + dy;
        const screenH = window.innerHeight || 800;
        if (ny < screenH * 0.3) ny = screenH * 0.3; // Floor boundary
        if (nx !== p.x || ny !== p.y || isWalk !== currentIsWalking || newDir !== currentDir) {
          currentIsWalking = isWalk;
          currentDir = newDir;
          setIsWalking(isWalk);
          setDirection(newDir as any);
          
          const now = Date.now();
          if (now - lastEmitTime > 50 && onMoveRef.current) {
            onMoveRef.current(nx, ny, newDir, isWalk);
            lastEmitTime = now;
          }
        } else if (!isWalk && currentIsWalking) {
           currentIsWalking = false;
           setIsWalking(false);
           if (onMoveRef.current) onMoveRef.current(nx, ny, newDir, false);
        }
        return { x: nx, y: ny };
      });
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameId);
    };
  }, [isMe]);

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
        src={`/${type}/${currentFrames[frameIdx]}`} 
        alt="avatar" 
      />
    </div>
  );
}
