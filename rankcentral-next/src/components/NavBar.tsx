// Seems to be unused, but let's keep it for now
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BarChart, Settings, FolderOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NavBar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Home', icon: <Home className="h-5 w-5" />, path: '/' },
    { name: 'Documents', icon: <FileText className="h-5 w-5" />, path: '/documents' },
    { name: 'Projects', icon: <FolderOpen className="h-5 w-5" />, path: '/projects' },
    { name: 'Results', icon: <BarChart className="h-5 w-5" />, path: '/results' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm
            ${pathname === item.path
              ? 'bg-brand-primary text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default NavBar;
