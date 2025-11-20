'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Lock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Plus, label: 'Create Multisig', href: '/create' },
  { icon: Lock, label: 'My Multisigs', href: '/multisigs' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-border bg-background px-4 py-6 transition-transform duration-200 md:relative md:top-0 md:z-0 md:h-auto md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-4 right-4 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          BlockDAG Multisig v0.1.0
        </p>
      </div>
    </aside>
  );
}
