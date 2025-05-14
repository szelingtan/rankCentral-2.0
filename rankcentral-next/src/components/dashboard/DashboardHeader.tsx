import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  username: string;
}

export function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {username}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href="/documents/compare">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Comparison
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}