// 📁 /src/app/dashboard/components/header/MobileMenu.tsx
'use client';

import { Button } from '@/components/ui/atoms/button';
import { Menu } from 'lucide-react';

interface MobileMenuProps {
  onClick: () => void;
}

export function MobileMenu({ onClick }: MobileMenuProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick} 
      className="lg:hidden text-foreground hover:text-origen-bosque hover:bg-origen-pradera/10"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}