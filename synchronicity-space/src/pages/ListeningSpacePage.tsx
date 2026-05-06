import React from 'react';
import './ListeningSpacePage.css';

export default function ListeningSpacePage() {
  return (
    <div>
      <div className="room-stage">
        <div className="retro-overlay"></div>

        <div className="room-wrapper">
          {/* The Back Wall - now sits higher up visually */}
          <div className="wall back-wall">
            <div className="ambient-glow"></div>
          </div>

          <div className="wall left-wall"></div>
          <div className="wall right-wall"></div>

          {/* The Large Floor */}
          {/* <div className='floor-part'> */}
          <div className='left-furniture'>
          <img className="couch" src="couch.svg"/>
          <img className="plant" src="plant.svg"/>
         
          </div>
           <img className='rug' src="rug.svg"/>
            <div className="floor">
              <div className="floor-texture-layer"></div>
            </div>
          {/* </div> */}

          {/* The Smaller Ceiling */}
          <div className="ceiling"></div>
        </div>
      </div>
      <div>
      </div>
    </div>
  );
}