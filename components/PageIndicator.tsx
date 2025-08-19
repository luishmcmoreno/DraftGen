'use client';

import { useEffect, useState } from 'react';

interface PageIndicatorProps {
  currentHeight: number;
  maxHeight: number;
}

export function PageIndicator({ currentHeight, maxHeight }: PageIndicatorProps) {
  const [fillPercentage, setFillPercentage] = useState(0);
  
  useEffect(() => {
    const percentage = Math.min((currentHeight / maxHeight) * 100, 100);
    setFillPercentage(percentage);
  }, [currentHeight, maxHeight]);

  const getColor = () => {
    if (fillPercentage < 70) return 'bg-green-500';
    if (fillPercentage < 85) return 'bg-yellow-500';
    if (fillPercentage < 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="absolute -right-12 top-0 h-full w-8 hidden xl:block">
      <div className="relative h-full">
        {/* Background track */}
        <div className="absolute inset-y-0 right-0 w-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Fill indicator */}
        <div 
          className={`absolute bottom-0 right-0 w-1 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ height: `${fillPercentage}%` }}
        />
        
        {/* Labels */}
        <div className="absolute -right-8 top-0 text-[9px] text-gray-400 whitespace-nowrap">
          Top
        </div>
        <div className="absolute -right-14 bottom-0 text-[9px] text-gray-400 whitespace-nowrap">
          Bottom
        </div>
        
        {/* Warning at 85% */}
        {fillPercentage > 85 && (
          <div 
            className="absolute right-2 text-[9px] text-orange-500 font-medium"
            style={{ bottom: '15%' }}
          >
            ⚠️
          </div>
        )}
      </div>
    </div>
  );
}