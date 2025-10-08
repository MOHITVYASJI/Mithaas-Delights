import React from 'react';
import { X, Award, Shield, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export const CertificationsModal = ({ isOpen, onClose, certType }) => {
  const certifications = {
    msme: {
      title: 'MSME Registration Certificate',
      subtitle: 'Ministry of MSME, Government of India',
      number: 'UDYAM-MP-23-0235652',
      description: 'Mithaas Delights is officially registered under the Micro, Small & Medium Enterprises Development Act, 2006. This certification validates our business as a recognized enterprise by the Government of India.',
      image: '/certificates/msme-certificate.jpg',
      icon: Award,
      color: 'green',
      benefits: [
        'Government Recognized Business',
        'Quality Assurance Standards',
        'Regulatory Compliance',
        'Authentic Indian Enterprise'
      ]
    },
    fssai: {
      title: 'FSSAI License Certificate',
      subtitle: 'Food Safety and Standards Authority of India',
      number: '21425850011554',
      description: 'Our FSSAI license certifies that Mithaas Delights complies with all food safety standards set by the Government of India. Every product is manufactured under strict hygiene and quality control measures.',
      image: '/certificates/fssai-certificate.jpg',
      icon: Shield,
      color: 'blue',
      benefits: [
        'Food Safety Certified',
        'Hygienic Manufacturing',
        'Quality Ingredients',
        'Regular Safety Audits'
      ]
    }
  };

  if (!certType || !certifications[certType]) return null;

  const cert = certifications[certType];
  const Icon = cert.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className={`w-12 h-12 bg-${cert.color}-100 rounded-full flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${cert.color}-700`} />
            </div>
            <div>
              <div className="text-xl font-bold">{cert.title}</div>
              <div className="text-sm font-normal text-gray-600">{cert.subtitle}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Certificate Number */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
            <p className="text-2xl font-bold text-orange-700" data-testid="cert-number">{cert.number}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-700 leading-relaxed">{cert.description}</p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">What This Means For You:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cert.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 bg-green-50 rounded-lg p-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Image */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <img 
              src={cert.image} 
              alt={cert.title}
              className="w-full h-auto cursor-pointer hover:scale-105 transition-transform"
              onClick={() => window.open(cert.image, '_blank')}
            />
          </div>

          {/* View Full Certificate */}
          <div className="flex justify-center">
            <button
              onClick={() => window.open(cert.image, '_blank')}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              data-testid="view-full-cert-button"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Certificate
            </button>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              This certificate is issued by the Government of India and validates our commitment to quality and compliance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
