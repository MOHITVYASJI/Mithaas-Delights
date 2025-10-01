import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Shield, Truck, Award } from 'lucide-react';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="hero-title">
            Welcome to <span className="text-orange-600">Mithaas Delights</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            Experience the finest traditional Indian sweets, crafted with love and
            the purest ingredients. Every bite is a celebration!
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700" data-testid="shop-now-button">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop Now
            </Button>
            <Button size="lg" variant="outline" data-testid="learn-more-button">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Mithaas Delights?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card data-testid="feature-card-quality">
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                <p className="text-gray-600 text-sm">
                  Made with the finest ingredients and traditional recipes
                </p>
              </CardContent>
            </Card>
            <Card data-testid="feature-card-fresh">
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Always Fresh</h3>
                <p className="text-gray-600 text-sm">
                  Prepared daily to ensure maximum freshness and taste
                </p>
              </CardContent>
            </Card>
            <Card data-testid="feature-card-delivery">
              <CardContent className="pt-6 text-center">
                <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                <p className="text-gray-600 text-sm">
                  Quick and safe delivery right to your doorstep
                </p>
              </CardContent>
            </Card>
            <Card data-testid="feature-card-trust">
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">100% Safe</h3>
                <p className="text-gray-600 text-sm">
                  FSSAI certified with strict quality controls
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-orange-600 text-white" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Experience the Magic?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands of happy customers who trust Mithaas Delights for their
            celebrations
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-orange-600 hover:bg-orange-50"
            data-testid="get-started-button"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};