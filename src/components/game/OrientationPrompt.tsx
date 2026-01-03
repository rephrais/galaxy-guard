import React from 'react';

const OrientationPrompt: React.FC = () => {
  return (
    <div className="orientation-overlay">
      <div className="orientation-content">
        {/* Animated Phone Icon */}
        <div className="phone-icon-container">
          <div className="phone-icon">
            <div className="phone-screen">
              <div className="phone-notch" />
            </div>
          </div>
          <div className="rotation-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="orientation-title">ROTATE YOUR DEVICE</h1>
        <p className="orientation-subtitle">
          For the best gaming experience, please rotate to landscape mode
        </p>

        {/* Decorative Elements */}
        <div className="orientation-scanlines" />
      </div>
    </div>
  );
};

export default OrientationPrompt;
