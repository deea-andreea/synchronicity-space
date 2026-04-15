export const Noise = () => {
  return (
    <svg 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: 0, 
        height: 0, 
        opacity: 0, 
        pointerEvents: 'none' 
      }}
    >
      <filter id="noise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.6" 
          numOctaves="3" 
          stitchTiles="stitch" 
        />
      </filter>
    </svg>
  );
};