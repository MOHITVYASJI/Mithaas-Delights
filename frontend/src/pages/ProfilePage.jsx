import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="profile-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" data-testid="profile-title">My Profile</h1>
        
        <Card data-testid="profile-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Account Information</span>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} data-testid="profile-role-badge">
                {user.role === 'admin' ? (
                  <>
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  'User'
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4" data-testid="profile-name">
              <User className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-medium">{user.name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4" data-testid="profile-email">
              <Mail className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4" data-testid="profile-joined">
              <Calendar className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-lg font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};