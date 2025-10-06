import React from 'react';
import { Badge } from './ui/badge';
import { Tag, Gift, Percent } from 'lucide-react';

/**
 * OfferBadge Component - Display offer badges on product cards
 */
export const OfferBadge = ({ offer, className = '' }) => {
  if (!offer) return null;

  const getBadgeStyle = () => {
    if (offer.badge_color) {
      return {
        backgroundColor: offer.badge_color,
        color: '#ffffff',
        fontWeight: 'bold'
      };
    }
    return {};
  };

  const getBadgeIcon = () => {
    switch (offer.offer_type) {
      case 'buy_x_get_y':
        return <Gift className="w-3 h-3 mr-1" />;
      case 'percentage':
      case 'flat_discount':
        return <Percent className="w-3 h-3 mr-1" />;
      default:
        return <Tag className="w-3 h-3 mr-1" />;
    }
  };

  const getBadgeText = () => {
    if (offer.badge_text) {
      return offer.badge_text;
    }

    // Generate badge text based on offer type
    switch (offer.offer_type) {
      case 'percentage':
        return `${offer.discount_percentage}% OFF`;
      case 'flat_discount':
        return `₹${offer.discount_amount} OFF`;
      case 'buy_x_get_y':
        return `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'SPECIAL OFFER';
    }
  };

  return (
    <Badge
      className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 text-xs font-bold shadow-md z-10 ${className}`}
      style={getBadgeStyle()}
      data-testid="offer-badge"
    >
      {getBadgeIcon()}
      {getBadgeText()}
    </Badge>
  );
};

/**
 * MultipleOffersBadge - Show multiple offers on a product
 */
export const MultipleOffersBadge = ({ offers, className = '' }) => {
  if (!offers || offers.length === 0) return null;

  if (offers.length === 1) {
    return <OfferBadge offer={offers[0]} className={className} />;
  }

  // Show first offer with count indicator
  return (
    <div className="absolute top-2 left-2 z-10">
      <OfferBadge offer={offers[0]} className="mb-1" />
      {offers.length > 1 && (
        <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5">
          +{offers.length - 1} more offers
        </Badge>
      )}
    </div>
  );
};

export default OfferBadge;