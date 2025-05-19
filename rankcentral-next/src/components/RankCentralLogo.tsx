import React from 'react';

export const RankCentralLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "", 
  size = 30
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 50 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <circle cx="25" cy="25" r="25" fill="#163b69" />
        <path 
          d="M15 17H35M15 25H30M15 33H25" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        <path 
          d="M37 23L31 29L28 26" 
          stroke="#4299e1" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      <span className="font-bold text-2xl ml-1 font-inter">
        <span className="text-[#163b69]">rank</span><span className="text-[#4299e1]">Central</span>
      </span>
    </div>
  );
};

export default RankCentralLogo;
