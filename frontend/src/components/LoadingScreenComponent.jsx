import React from 'react';

export const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 z-[9999]">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <img 
            src="/mithaas-logo.png" 
            alt="Mithaas Delights Logo" 
            className="w-32 h-32 object-contain animate-pulse"
          />
          {/* Circular spinner around logo */}
          <div className="absolute inset-0 -m-2">
            <div className="w-36 h-36 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent mb-2">
            Mithaas Delights
          </h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
