import React, { useState } from 'react';
import axios from 'axios';
import { Package, Building2, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BulkOrderPage = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    product_details: '',
    quantity: '',
    preferred_date: '',
    delivery_address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/bulk-orders`, formData);
      toast.success('Bulk order request submitted successfully! We will contact you soon.');
      
      // Reset form
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        product_details: '',
        quantity: '',
        preferred_date: '',
        delivery_address: ''
      });
    } catch (error) {
      console.error('Bulk order submission error:', error);
      toast.error('Failed to submit bulk order request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Package className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bulk & Corporate Orders</h1>
          <p className="text-lg text-gray-600">
            Looking to order in bulk for your company event, wedding, or special occasion?<br />
            Fill out the form below and our team will get back to you with a custom quote.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request a Bulk Order Quote</CardTitle>
            <CardDescription>
              Minimum order: 5kg or 50 boxes. Special discounts available for large orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex text-sm font-medium mb-2 items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Company Name *
                  </label>
                  <Input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="ABC Corporation"
                    required
                    data-testid="company-name-input"
                  />
                </div>
                <div>
                  <label className="flex text-sm font-medium mb-2 items-center">
                    <User className="w-4 h-4 mr-2" />
                    Contact Person *
                  </label>
                  <Input
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    data-testid="contact-person-input"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex text-sm font-medium mb-2 items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    required
                    data-testid="email-input"
                  />
                </div>
                <div>
                  <label className="flex text-sm font-medium mb-2 items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone *
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    data-testid="phone-input"
                  />
                </div>
              </div>

              {/* Product Details */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Details *
                </label>
                <textarea
                  name="product_details"
                  value={formData.product_details}
                  onChange={handleChange}
                  placeholder="Describe what products you need (e.g., Kaju Katli, Gulab Jamun, Mixed Sweets, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="4"
                  required
                  data-testid="product-details-input"
                />
              </div>

              {/* Quantity & Date */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity *
                  </label>
                  <Input
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 100 boxes, 50 kg"
                    required
                    data-testid="quantity-input"
                  />
                </div>
                <div>
                  <label className="flex text-sm font-medium mb-2 items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Preferred Date
                  </label>
                  <Input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleChange}
                    data-testid="preferred-date-input"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="flex text-sm font-medium mb-2 items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Delivery Address *
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  placeholder="Full delivery address with pincode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  required
                  data-testid="delivery-address-input"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-3 text-lg"
                  data-testid="submit-bulk-order-button"
                >
                  {loading ? 'Submitting...' : 'Request Quote'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold mb-2">Special Discounts</h3>
              <p className="text-sm text-gray-600">
                Get attractive discounts on bulk orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold mb-2">Custom Packaging</h3>
              <p className="text-sm text-gray-600">
                Branded packaging options available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-semibold mb-2">On-Time Delivery</h3>
              <p className="text-sm text-gray-600">
                Guaranteed delivery for your events
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderPage;