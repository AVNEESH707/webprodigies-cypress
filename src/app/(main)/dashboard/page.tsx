import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

import { cookies } from 'next/headers';
import db from '@/lib/supabase/db';
import { redirect } from 'next/navigation';
import DashboardSetup from '@/components/dashboard-setup/dashboard-setup';
import { getUserSubscriptionStatus } from '@/lib/supabase/queries';

const DashboardPage = async () => {
  const supabase = createServerComponentClient({ cookies });

  try {
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    
    // In dev mode, create a mock user
    if (devMode) {
      return (
        <div className="bg-background h-screen w-screen flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">🚀 Dev Mode</h1>
            <p className="text-muted-foreground mb-4">
              Running in development mode without Supabase connectivity
            </p>
            <DashboardSetup
              user={{
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
              } as any}
              subscription={null}
            />
          </div>
        </div>
      );
    }

    // Production mode: fetch user
    let user: User | null = null;
    let userError = null;
    
    try {
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('User fetch timeout')), 8000)
        ),
      ] as any);
      
      user = result?.data?.user;
      userError = result?.error;
    } catch (err) {
      userError = err;
    }

    if (userError || !user) {
      return (
        <div className="bg-background h-screen w-screen flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Unable to Connect</h1>
            <p className="text-muted-foreground">
              Having trouble reaching the server. Please check your connection and try again.
            </p>
          </div>
        </div>
      );
    }

    // Fetch workspace with timeout
    let workspace = null;
    try {
      workspace = await Promise.race([
        db.query.workspaces.findFirst({
          where: (workspace, { eq }) => eq(workspace.workspaceOwner, user!.id),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Workspace fetch timeout')), 8000)
        ),
      ] as any);
    } catch (err) {
      console.log('Workspace fetch error:', err);
    }

    // Fetch subscription with timeout
    let subscription = null;
    try {
      const result = await Promise.race([
        getUserSubscriptionStatus(user!.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Subscription fetch timeout')), 5000)
        ),
      ] as any);
      subscription = result?.data;
    } catch (err) {
      console.log('Subscription fetch error:', err);
    }

    if (!workspace)
      return (
        <div
          className="bg-background
          h-screen
          w-screen
          flex
          justify-center
          items-center
    "
        >
          <DashboardSetup
            user={user}
            subscription={subscription}
          />
        </div>
      );

    redirect(`/dashboard/${workspace.id}`);
  } catch (error) {
    console.log('Dashboard error:', error);
    return (
      <div className="bg-background h-screen w-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
          <p className="text-muted-foreground">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }
};

export default DashboardPage;
