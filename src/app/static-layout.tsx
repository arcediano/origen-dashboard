'use client';

import { DashboardBreadcrumb } from './dashboard/components/header/DashboardBreadcrumb';
import { DashboardFooter } from './dashboard/components/footer/DashboardFooter';

export default function StaticLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto px-4">
          <DashboardBreadcrumb />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <DashboardFooter />
        </div>
      </footer>
    </div>
  );
}