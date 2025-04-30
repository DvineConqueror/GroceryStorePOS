import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  approved: boolean;  // Added approved field
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
  
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
  
        if (profileError) throw profileError;
  
        if (!profileData.approved) {
          await supabase.auth.signOut();
          throw new Error('Your account is not yet approved by an admin.');
        }
  
        setProfile(profileData);
        return profileData;
      }
      return null;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({ 
        email, 
        password
      });
      
      if (error) throw error;
  
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            full_name: fullName,
            role: 'cashier',
            approved: false  // Set approved to false by default
          }])
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
          created_at: null,
          updated_at: null
        });
      }
  
      toast({
        title: "Success",
        description: "Account created successfully. Please wait for admin approval.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}