import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string;
  approved: boolean;
}

const AdminPage = () => {
  const { profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const navigate = useNavigate();

  // Function to handle navigation back to login page
  const handleBackToLogin = () => {
    navigate('/login');
  };

  useEffect(() => {
    console.log('Current user profile:', profile);
    
    if (profile?.role === 'admin') {
      console.log('User is admin, fetching pending users');
      fetchPendingUsers();
    } else {
      console.log('User is not admin, role:', profile?.role);
    }
  }, [profile]);

  const fetchPendingUsers = async () => {
    setDebugInfo('Fetching pending users...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, approved, role')
        .eq('approved', false);

      if (error) {
        console.error('Error fetching pending users:', error);
        setDebugInfo(`Error fetching pending users: ${error.message}`);
        toast({
          title: "Error",
          description: `Failed to fetch pending users: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Fetched pending users:', data);
      
      // Check if data is valid
      if (!data) {
        setDebugInfo('No data returned from query');
        setPendingUsers([]);
        return;
      }
      
      data.forEach(user => {
        console.log(`Pending user: ${user.full_name}, ID: ${user.id}, Approved: ${user.approved}`);
      });
      
      setDebugInfo(`Found ${data.length} pending users`);
      setPendingUsers(data);
    } catch (e) {
      console.error('Unexpected error:', e);
      setDebugInfo(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const checkUserAuth = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking user:', error);
        return false;
      }
      
      return !!data;
    } catch (e) {
      console.error('Error in checkUserAuth:', e);
      return false;
    }
  };

  const approveUser = async (userId: string) => {
    const userExists = await checkUserAuth(userId);
    
    if (!userExists) {
      toast({
        title: "Error",
        description: "User no longer exists in the system",
        variant: "destructive"
      });
      fetchPendingUsers();
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "User approved successfully",
    });
    fetchPendingUsers();
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p>Access denied. Only admins can view this page.</p>
            <p className="text-sm text-gray-500 mt-2">Your role: {profile?.role || 'Not logged in'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Dashboard</CardTitle>
          <Button variant="outline" onClick={handleBackToLogin}>
            Back to Login
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p>Logged in as: {profile.full_name}</p>
              <p className="text-sm text-gray-500">Role: {profile.role}</p>
            </div>
            <Button onClick={fetchPendingUsers}>Refresh Users</Button>
          </div>
          
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-mono">{debugInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending User Approvals</CardTitle>
        </CardHeader>
        <CardContent>          
          {pendingUsers.length === 0 ? (
            <p>No pending user approvals.</p>
          ) : (
            <ul className="space-y-4">
              {pendingUsers.map((user) => (
                <li key={user.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-500">ID: {user.id}</p>
                  </div>
                  <Button onClick={() => approveUser(user.id)}>Approve</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;