import React, { useState } from 'react';
import { Award, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CertificationsModal } from './CertificationsModal';

export const CertificationShowcase = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const handleViewCertificate = (certType) => {
    setSelectedCert(certType);
    setShowModal(true);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50" id="certifications">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-700 mb-4 text-sm">
            Legal Identity & Certifications
          </Badge>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our Government
            <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Certifications & Compliance
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are a legally registered and government-certified business, ensuring the highest 
            standards of quality, safety, and authenticity in every product we deliver.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* MSME Certificate Card */}
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-300">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">MSME Registered</h3>
                  <p className="text-green-100 text-sm">Ministry of MSME, Govt. of India</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                <code className="bg-green-50 text-green-800 px-3 py-2 rounded font-mono text-sm block">
                  UDYAM-MP-23-0235652
                </code>
              </div>
              
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                Officially registered under the Micro, Small & Medium Enterprises Development Act, 2006. 
                This validates our business as a recognized enterprise by the Government of India.
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Government Recognized Business</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Quality Assurance Standards</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Regulatory Compliance</span>
                </div>
              </div>

              <Button
                onClick={() => handleViewCertificate('msme')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                data-testid="view-msme-cert-button"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View MSME Certificate
              </Button>
            </CardContent>
          </Card>

          {/* FSSAI Certificate Card */}
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">FSSAI Certified</h3>
                  <p className="text-blue-100 text-sm">Food Safety & Standards Authority</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">License Number</p>
                <code className="bg-blue-50 text-blue-800 px-3 py-2 rounded font-mono text-sm block">
                  21425850011554
                </code>
              </div>
              
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                Licensed by FSSAI, ensuring compliance with all food safety standards. Every product is 
                manufactured under strict hygiene and quality control measures.
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Food Safety Certified</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Hygienic Manufacturing Process</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Regular Quality Audits</span>
                </div>
              </div>

              <Button
                onClick={() => handleViewCertificate('fssai')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="view-fssai-cert-button"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View FSSAI Certificate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-gray-800 text-sm">100% Vegetarian</p>
            <p className="text-xs text-gray-600 mt-1">Pure Veg Products</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">🇮🇳</div>
            <p className="font-semibold text-gray-800 text-sm">Made in India</p>
            <p className="text-xs text-gray-600 mt-1">Authentic Quality</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">🔒</div>
            <p className="font-semibold text-gray-800 text-sm">Secure Payments</p>
            <p className="text-xs text-gray-600 mt-1">SSL Encrypted</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">↩️</div>
            <p className="font-semibold text-gray-800 text-sm">Easy Returns</p>
            <p className="text-xs text-gray-600 mt-1">Hassle-free Policy</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-md border-2 border-orange-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-orange-600">Verified Business</span> by Government of India 
              <span className="ml-2">🇮🇳</span>
            </p>
          </div>
        </div>
      </div>

      <CertificationsModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        certType={selectedCert}
      />
    </section>
  );
};
