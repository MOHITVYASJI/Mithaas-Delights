import React from 'react';

/**
 * Professional, responsive Logo component for Mithaas Delights
 * Usage: <Logo size="sm|md|lg|xl" variant="default|white|watermark" className="..." />
 */
export const Logo = ({ 
  size = 'md', 
  variant = 'default', 
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    xxl: 'w-48 h-48'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    xxl: 'text-3xl'
  };

  const variantClasses = {
    default: '',
    white: 'brightness-0 invert',
    watermark: 'opacity-10',
    subtle: 'opacity-30'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/mithaas-logo.png" 
        alt="Mithaas Delights Logo" 
        className={`${sizeClasses[size]} object-contain ${variantClasses[variant]} transition-transform hover:scale-105`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent`}>
            Mithaas Delights
          </span>
          {size !== 'xs' && size !== 'sm' && (
            <span className="text-xs text-gray-500">Premium Sweets & Snacks</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Logo for use in headers (horizontal layout)
 */
export const HeaderLogo = ({ className = '' }) => (
  <Logo size="sm" showText={true} className={className} />
);

/**
 * Logo for use in footers
 */
export const FooterLogo = ({ className = '' }) => (
  <Logo size="md" showText={true} className={className} />
);

/**
 * Large logo for splash/loading screens
 */
export const SplashLogo = ({ className = '' }) => (
  <Logo size="xxl" showText={false} className={`${className} animate-pulse`} />
);

/**
 * Watermark logo for backgrounds
 */
export const WatermarkLogo = ({ className = '' }) => (
  <img 
    src="/mithaas-logo.png" 
    alt="" 
    className={`absolute opacity-5 pointer-events-none ${className}`}
    style={{ width: '300px', height: '300px' }}
  />
);

export default Logo;
