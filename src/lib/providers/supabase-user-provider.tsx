'use client';

import { AuthUser } from '@supabase/supabase-js';
import { Subscription } from '../supabase/supabase.types';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getUserSubscriptionStatus } from '../supabase/queries';
import { useToast } from '@/components/ui/use-toast';

type SupabaseUserContextType = {
  user: AuthUser | null;
  subscription: Subscription | null;
};

const SupabaseUserContext = createContext<SupabaseUserContextType>({
  user: null,
  subscription: null,
});

export const useSupabaseUser = () => {
  return useContext(SupabaseUserContext);
};

interface SupabaseUserProviderProps {
  children: React.ReactNode;
}

export const SupabaseUserProvider: React.FC<SupabaseUserProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  const supabase = createClientComponentClient();

  //Fetch the user details with timeout
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let toastShown = false;

    // Skip auth in dev mode
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    
    const getUser = async () => {
      if (devMode) {
        // In dev mode, set a mock user
        const mockUser = {
          id: 'dev-user',
          email: 'dev@localhost',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmation_sent_at: null,
          recovery_sent_at: null,
          email_confirmed_at: null,
          phone_confirmed_at: null,
          new_phone: null,
          new_email: null,
          new_user_as_admin: null,
          invite_sent_at: null,
          deleted_at: null,
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (isMounted) {
          setUser(mockUser as any);
          setSubscription(null); // No subscription in dev mode
        }
        return;
      }

      try {
        // Create a timeout promise that rejects after 8 seconds
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 8000)
        );

        const { data, error: userError } = await Promise.race([
          userPromise,
          timeoutPromise,
        ] as any);

        if (!isMounted) return;

        if (userError) {
          // Silent fail - don't show toast to reduce noise
          console.log('Auth error:', userError);
          return;
        }

        const user = data?.user;
        if (user) {
          console.log(user);
          setUser(user);
          
          // Fetch subscription with timeout
          try {
            const subscriptionPromise = getUserSubscriptionStatus(user.id);
            const subTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Subscription timeout')), 5000)
            );
            
            const { data: subData, error: subError } = await Promise.race([
              subscriptionPromise,
              subTimeoutPromise,
            ] as any);

            if (isMounted) {
              if (subData) setSubscription(subData);
              if (subError) {
                console.log('Subscription error:', subError);
              }
            }
          } catch (subErr) {
            console.log('Subscription fetch error:', subErr);
            // Don't show error toast for subscription - app can work without it
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.log('Get user error:', err);
        // Silent fail - app will work in limited mode
      }
    };

    getUser();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [supabase, toast]);
  return (
    <SupabaseUserContext.Provider value={{ user, subscription }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};
