import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for session tokens

// Updated Profile interface with active_session_token
interface Profile {
  id: string;
  full_name: string;
  role: string;
  approved: boolean;
  active_session_token: string | null; // Added for session management
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
  authLoading: boolean; // Added to track authentication operations separately
  refreshSession: () => Promise<void>; // Added to manually refresh session
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  // Function to refresh session and profile data
  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        // Check session token validity
        const localToken = localStorage.getItem('session_token');
        if (localToken && localToken !== profileData.active_session_token) {
          await supabase.auth.signOut();
          localStorage.removeItem('session_token');
          toast({
            title: "Session Invalidated",
            description: "Your session has been invalidated. Please log in again.",
            variant: "destructive",
          });
        } else {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial session check and auth state listener
  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshSession();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription to monitor session token changes
  useEffect(() => {
    if (user) {
      try {
        const subscription = supabase
          .channel(`profiles:id=eq.${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            async (payload) => {
              try {
                const newProfile = payload.new as Profile;
                const localToken = localStorage.getItem('session_token');
                
                // Only process if we have both tokens and they don't match
                if (localToken && newProfile.active_session_token && 
                    newProfile.active_session_token !== localToken) {
                  setAuthLoading(true);
                  await supabase.auth.signOut();
                  localStorage.removeItem('session_token');
                  setProfile(null);
                  
                  toast({
                    title: "Session Invalidated",
                    description: "You have been logged out because you logged in from another device.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Error processing profile update:', error);
              } finally {
                setAuthLoading(false);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthLoading(true);
      
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        // Generate a unique session token
        const sessionToken = uuidv4();

        // Update the user's profile with the new session token
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ active_session_token: sessionToken })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Store the session token locally
        localStorage.setItem('session_token', sessionToken);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!profileData.approved) {
          await supabase.auth.signOut();
          localStorage.removeItem('session_token'); // Clean up
          throw new Error('Your account is not yet approved by an admin.');
        }

        setProfile(profileData);
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, message: error.message };
    } finally {
      setAuthLoading(false);
    }
  };


  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setAuthLoading(true);
      
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: fullName,
              role: 'cashier',
              approved: false,
              active_session_token: null, // Initialize with null
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          await supabase.auth.admin.deleteUser(user.id);
          throw new Error('Failed to create user profile');
        }

        setProfile({
          id: user.id,
          full_name: fullName,
          role: 'cashier',
          approved: false,
          active_session_token: null,
          created_at: null,
          updated_at: null,
        });
      }

      toast({
        title: "Success",
        description: "Account created successfully. Please wait for admin approval.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, message: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      localStorage.removeItem('session_token'); // Clean up local token
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      signIn,
      signUp,
      signOut,
      loading,
      authLoading,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}