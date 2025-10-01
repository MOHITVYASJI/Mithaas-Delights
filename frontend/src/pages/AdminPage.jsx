import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Package, ShoppingCart, Users, Star } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="admin-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" data-testid="admin-title">Admin Dashboard</h1>
          <Badge className="bg-green-600" data-testid="admin-badge">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Admin Access
          </Badge>
        </div>

        <div className="mb-8">
          <p className="text-gray-600" data-testid="admin-welcome">
            Welcome back, <span className="font-semibold">{user?.name}</span>! Here's your admin control panel.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="admin-stat-products">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total products</p>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total orders</p>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-reviews">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card data-testid="admin-products-section">
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your product catalog, add new items, update variants and pricing.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-100 rounded-lg text-sm">
                  📦 Products feature coming soon...
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="admin-orders-section">
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage customer orders, update order status and tracking.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-100 rounded-lg text-sm">
                  🛒 Orders feature coming soon...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};