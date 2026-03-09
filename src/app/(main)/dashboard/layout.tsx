import { SubscriptionModalProvider } from '@/lib/providers/subscription-modal-provider';
import { getActiveProductsWithPrice } from '@/lib/supabase/queries';
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const Layout: React.FC<LayoutProps> = async ({ children }) => {
  const { data: products, error } = await getActiveProductsWithPrice();

  if (error) {
    console.log('Stripe tables missing. Skipping products fetch.');
  }

  return (
    <main className="flex overflow-hidden h-screen">
      <SubscriptionModalProvider products={products ?? []}>
        {children}
      </SubscriptionModalProvider>
    </main>
  );
};

export default Layout;