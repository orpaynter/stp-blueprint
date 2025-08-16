import React, { useState } from 'react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 4,
  gap = 'medium',
  className = '',
}) => {
  const getGapClass = () => {
    switch (gap) {
      case 'small':
        return 'gap-2 sm:gap-3 md:gap-4';
      case 'large':
        return 'gap-6 sm:gap-8 md:gap-10';
      default:
        return 'gap-4 sm:gap-5 md:gap-6';
    }
  };

  const getGridClass = () => {
    return `grid ${getGapClass()} ${className}
      grid-cols-${mobileColumns}
      sm:grid-cols-${tabletColumns}
      lg:grid-cols-${desktopColumns}
    `;
  };

  return (
    <div className={getGridClass()}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
