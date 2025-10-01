import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Lock, FileText, Mail } from 'lucide-react';

export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-8 h-8 text-orange-600" />
                <CardTitle className="text-3xl">Terms & Conditions</CardTitle>
              </div>
              <p className="text-gray-600">Last Updated: January 2025</p>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                <p>
                  Welcome to Mithaas Delights. By accessing and using our website, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Use of Website</h2>
                <p className="mb-2">You agree to use our website only for lawful purposes and in a way that does not infringe the rights of others.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You must be 18 years or older to place an order</li>
                  <li>Provide accurate information during registration and ordering</li>
                  <li>Keep your account credentials secure</li>
                  <li>Not misuse or attempt to hack our services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Products and Pricing</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All products are subject to availability</li>
                  <li>Prices are subject to change without prior notice</li>
                  <li>We reserve the right to limit quantities</li>
                  <li>Product images are for illustration purposes only</li>
                  <li>Actual products may vary slightly in appearance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Orders and Payment</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All orders are subject to acceptance and availability</li>
                  <li>We accept Cash on Delivery and online payments</li>
                  <li>Payment must be made in full before dispatch</li>
                  <li>We reserve the right to cancel orders at our discretion</li>
                  <li>Refunds will be processed as per our refund policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Delivery</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>Free delivery on orders above minimum amount</li>
                  <li>We are not liable for delays due to circumstances beyond our control</li>
                  <li>Risk passes to you upon delivery</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Returns and Refunds</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Due to the perishable nature of our products, returns are limited</li>
                  <li>Damaged or defective products can be reported within 24 hours</li>
                  <li>Refunds will be processed within 7-10 business days</li>
                  <li>Contact customer support for return requests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Intellectual Property</h2>
                <p>
                  All content on this website, including text, graphics, logos, images, and software, is the property of Mithaas Delights and protected by copyright laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Limitation of Liability</h2>
                <p>
                  Mithaas Delights shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website or products.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Food Safety</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All products are prepared in FSSAI certified facilities</li>
                  <li>We follow strict hygiene and quality standards</li>
                  <li>Allergen information is provided where applicable</li>
                  <li>Consume products before expiry date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact Information</h2>
                <p className="mb-2">For questions about these terms, please contact us:</p>
                <ul className="space-y-1">
                  <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-orange-600" /> mithaasdelightsofficial@gmail.com</li>
                  <li>📞 +91 8989549544</li>
                  <li>📍 64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-8 h-8 text-orange-600" />
                <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              </div>
              <p className="text-gray-600">Last Updated: January 2025</p>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
                <p className="mb-2">We collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Personal Information:</strong> Name, email, phone number, delivery address</li>
                  <li><strong>Payment Information:</strong> Payment method details (securely processed)</li>
                  <li><strong>Order Information:</strong> Purchase history, preferences</li>
                  <li><strong>Technical Information:</strong> IP address, browser type, device information</li>
                  <li><strong>Usage Data:</strong> How you interact with our website</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
                <p className="mb-2">We use your information to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate about orders and deliveries</li>
                  <li>Provide customer support</li>
                  <li>Send promotional offers (with your consent)</li>
                  <li>Improve our products and services</li>
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Data Sharing and Disclosure</h2>
                <p className="mb-2">We may share your information with:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Service Providers:</strong> Delivery partners, payment processors</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
                </ul>
                <p className="mt-2">We never sell your personal information to third parties.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Security</h2>
                <p className="mb-2">We implement security measures to protect your information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encrypted data transmission (SSL/TLS)</li>
                  <li>Secure payment processing</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security audits</li>
                  <li>Employee confidentiality agreements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Cookies and Tracking</h2>
                <p className="mb-2">We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Remember your preferences</li>
                  <li>Maintain shopping cart</li>
                  <li>Analyze website usage</li>
                  <li>Personalize content</li>
                </ul>
                <p className="mt-2">You can control cookies through your browser settings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Data Retention</h2>
                <p>
                  We retain your information for as long as necessary to provide our services and comply with legal obligations. Order history is kept for 7 years for tax purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Children's Privacy</h2>
                <p>
                  Our services are not intended for children under 18. We do not knowingly collect information from children.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Third-Party Links</h2>
                <p>
                  Our website may contain links to third-party websites. We are not responsible for their privacy practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to Privacy Policy</h2>
                <p>
                  We may update this policy from time to time. We will notify you of significant changes via email or website notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact Us</h2>
                <p className="mb-2">For privacy-related questions or to exercise your rights, contact us:</p>
                <ul className="space-y-1">
                  <li className="flex items-center"><Mail className="w-4 h-4 mr-2 text-orange-600" /> mithaasdelightsofficial@gmail.com</li>
                  <li>📞 +91 8989549544</li>
                  <li>📍 64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India</li>
                </ul>
              </section>

              <section className="bg-orange-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Your Trust Matters
                </h2>
                <p>
                  At Mithaas Delights, we are committed to protecting your privacy and handling your data responsibly. If you have any concerns, please don't hesitate to reach out to us.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
