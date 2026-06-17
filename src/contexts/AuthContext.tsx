import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isApproved: boolean;
  userRole: string | null;
  allowedPages: string[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role, is_approved')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setIsAdmin(data.role === 'admin');
      setIsApproved(data.is_approved === true);
      setUserRole(data.role);
    } else {
      setIsAdmin(false);
      setIsApproved(false);
      setUserRole(null);
    }

    // Fetch page permissions
    const { data: perms } = await supabase
      .from('user_page_permissions')
      .select('page_path')
      .eq('user_id', userId);
    
    setAllowedPages((perms || []).map(p => p.page_path));
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) {
              setLoading(true);
              checkUserRole(session.user.id).finally(() => {
                if (isMounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsApproved(false);
          setUserRole(null);
          setAllowedPages([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsApproved(false);
    setUserRole(null);
    setAllowedPages([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isApproved, userRole, allowedPages, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
