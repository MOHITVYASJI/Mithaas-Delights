import React from 'react';
import { CreditCard, Smartphone, Lock } from 'lucide-react';

export const SecurePaymentBadges = ({ variant = 'default', className = '' }) => {
  
  // Mini variant for checkout button area
  if (variant === 'mini') {
    return (
      <div className={`flex items-center justify-center gap-2 text-xs text-gray-600 ${className}`}>
        <Lock className="w-3 h-3 text-green-600" />
        <span>Secure Payment</span>
        <div className="flex items-center gap-1 ml-2">
          <CreditCard className="w-3 h-3" />
          <Smartphone className="w-3 h-3" />
        </div>
      </div>
    );
  }

  // Compact variant for product pages
  if (variant === 'compact') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-green-700" />
          <span className="text-sm font-semibold text-green-800">100% Secure Payments</span>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Payment Method Icons */}
          <PaymentIcon type="visa" />
          <PaymentIcon type="mastercard" />
          <PaymentIcon type="rupay" />
          <PaymentIcon type="upi" />
          <PaymentIcon type="paytm" />
        </div>
      </div>
    );
  }

  // Default/Full variant for footer
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-green-400" />
        <h4 className="text-white font-semibold">Secure Payment Options</h4>
      </div>
      
      <div className="grid grid-cols-5 gap-3 mb-3">
        <PaymentIcon type="visa" size="large" />
        <PaymentIcon type="mastercard" size="large" />
        <PaymentIcon type="rupay" size="large" />
        <PaymentIcon type="upi" size="large" />
        <PaymentIcon type="paytm" size="large" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <PaymentIcon type="razorpay" size="medium" />
        <PaymentIcon type="googlepay" size="medium" />
        <PaymentIcon type="phonepe" size="medium" />
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-400">
          🔒 All transactions are encrypted & secured
        </p>
      </div>
    </div>
  );
};

// Payment Icon Component with placeholder designs
const PaymentIcon = ({ type, size = 'default' }) => {
  const sizeClasses = {
    small: 'w-8 h-6',
    default: 'w-12 h-8',
    medium: 'w-16 h-10',
    large: 'w-14 h-10'
  };

  const iconConfig = {
    visa: {
      bg: 'bg-blue-600',
      text: 'VISA',
      textColor: 'text-white'
    },
    mastercard: {
      bg: 'bg-red-600',
      text: 'MC',
      textColor: 'text-white'
    },
    rupay: {
      bg: 'bg-green-600',
      text: 'RuPay',
      textColor: 'text-white'
    },
    upi: {
      bg: 'bg-orange-600',
      text: 'UPI',
      textColor: 'text-white'
    },
    paytm: {
      bg: 'bg-blue-500',
      text: 'Paytm',
      textColor: 'text-white'
    },
    razorpay: {
      bg: 'bg-indigo-600',
      text: 'Razorpay',
      textColor: 'text-white'
    },
    googlepay: {
      bg: 'bg-white',
      text: 'GPay',
      textColor: 'text-gray-800',
      border: true
    },
    phonepe: {
      bg: 'bg-purple-600',
      text: 'PhonePe',
      textColor: 'text-white'
    }
  };

  const config = iconConfig[type] || iconConfig.visa;
  const borderClass = config.border ? 'border-2 border-gray-300' : '';

  return (
    <div 
      className={`${sizeClasses[size]} ${config.bg} ${borderClass} rounded flex items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
      title={`Pay with ${config.text}`}
    >
      <span className={`${config.textColor} font-bold text-xs ${size === 'large' || size === 'medium' ? 'text-sm' : ''}`}>
        {config.text}
      </span>
    </div>
  );
};

// Checkout specific component
export const CheckoutSecurityBadge = ({ className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">100% Secure Checkout</p>
            <p className="text-xs text-gray-600">Your payment info is safe with us</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <PaymentIcon type="visa" size="small" />
        <PaymentIcon type="mastercard" size="small" />
        <PaymentIcon type="rupay" size="small" />
        <PaymentIcon type="upi" size="small" />
        <PaymentIcon type="paytm" size="small" />
        <PaymentIcon type="razorpay" size="small" />
        <PaymentIcon type="googlepay" size="small" />
      </div>

      <p className="text-center text-xs text-gray-500 mt-3">
        SSL Encrypted | Verified by FSSAI & MSME
      </p>
    </div>
  );
};
