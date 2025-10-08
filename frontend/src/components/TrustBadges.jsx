import React, { useState } from 'react';
import { Shield, Lock, Award, CheckCircle } from 'lucide-react';
import { CertificationsModal } from './CertificationsModal';

export const TrustBadges = ({ variant = 'full', className = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const handleCertClick = (certType) => {
    setSelectedCert(certType);
    setShowModal(true);
  };

  // Compact variant for product pages
  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center gap-3 text-sm ${className}`}>
          <div 
            className="flex items-center gap-1 text-green-700 hover:text-green-800 cursor-pointer transition-colors"
            onClick={() => handleCertClick('msme')}
            title="MSME Certified - Click for details"
          >
            <Award className="w-4 h-4" />
            <span className="font-medium">MSME Certified</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div 
            className="flex items-center gap-1 text-blue-700 hover:text-blue-800 cursor-pointer transition-colors"
            onClick={() => handleCertClick('fssai')}
            title="FSSAI Registered - Click for details"
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium">FSSAI Registered</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1 text-orange-700">
            <span className="text-lg">🇮🇳</span>
            <span className="font-medium">Made in India</span>
          </div>
        </div>
        <CertificationsModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          certType={selectedCert}
        />
      </>
    );
  }

  // Inline variant for checkout/payment
  if (variant === 'inline') {
    return (
      <>
        <div className={`flex items-center justify-center gap-4 text-xs ${className}`}>
          <div 
            className="flex items-center gap-1 text-green-700 hover:text-green-800 cursor-pointer"
            onClick={() => handleCertClick('msme')}
          >
            <Award className="w-3 h-3" />
            <span>MSME</span>
          </div>
          <div 
            className="flex items-center gap-1 text-blue-700 hover:text-blue-800 cursor-pointer"
            onClick={() => handleCertClick('fssai')}
          >
            <Shield className="w-3 h-3" />
            <span>FSSAI</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <Lock className="w-3 h-3" />
            <span>100% Secure</span>
          </div>
        </div>
        <CertificationsModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          certType={selectedCert}
        />
      </>
    );
  }

  // Full variant for footer
  return (
    <>
      <div className={`bg-white/5 backdrop-blur-sm rounded-lg p-6 ${className}`}>
        <h4 className="text-white font-semibold mb-4 text-center">Trusted & Certified</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* MSME Badge */}
          <div 
            className="bg-white rounded-lg p-3 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleCertClick('msme')}
            data-testid="msme-badge"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-green-700" />
              </div>
              <p className="text-xs font-semibold text-gray-800">MSME Registered</p>
              <p className="text-[10px] text-gray-600 mt-1">UDYAM-MP-23-0235652</p>
            </div>
          </div>

          {/* FSSAI Badge */}
          <div 
            className="bg-white rounded-lg p-3 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleCertClick('fssai')}
            data-testid="fssai-badge"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-700" />
              </div>
              <p className="text-xs font-semibold text-gray-800">FSSAI Certified</p>
              <p className="text-[10px] text-gray-600 mt-1">21425850011554</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/20">
          <div className="flex items-center gap-1 text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">100% Veg</span>
          </div>
          <div className="w-px h-3 bg-white/30"></div>
          <div className="flex items-center gap-1 text-blue-300">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Secure</span>
          </div>
          <div className="w-px h-3 bg-white/30"></div>
          <div className="flex items-center gap-1 text-orange-300">
            <span className="text-sm">🇮🇳</span>
            <span className="text-xs">Made in India</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          ✅ Verified Business by Govt. of India
        </p>
      </div>
      
      <CertificationsModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        certType={selectedCert}
      />
    </>
  );
};
