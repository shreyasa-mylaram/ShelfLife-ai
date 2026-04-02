import React from 'react';

const HealthGauge = ({ score = 100, size = "md", animate = true }) => {
  let color = score > 70 ? "text-green-500" : score > 40 ? "text-yellow-500" : "text-red-500";
  let strokeColor = score > 70 ? "#22c55e" : score > 40 ? "#eab308" : "#ef4444";
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${size === "md" ? "w-24 h-24" : "w-16 h-16"}`}>
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r={radius} 
          stroke="currentColor" 
          strokeWidth="8" 
          fill="transparent" 
          className="text-gray-200" 
        />
        <circle 
          cx="50" cy="50" r={radius} 
          stroke={strokeColor} 
          strokeWidth="8" 
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? strokeDashoffset : 0}
          className={`transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`font-bold ${size === "md" ? "text-xl" : "text-sm"} ${color}`}>
          {score}%
        </span>
      </div>
    </div>
  );
};

export default HealthGauge;
