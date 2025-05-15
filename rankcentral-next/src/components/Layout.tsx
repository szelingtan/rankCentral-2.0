import React from 'react';
import Link from 'next/link';
import RankCentralLogo from './RankCentralLogo';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Settings, Home, GitCompare, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link href="/">
            <RankCentralLogo className="mx-auto" />
          </Link>
        </div>
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="px-2 space-y-1">
            <Link 
              href="/" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <Home className="mr-3 h-5 w-5 text-gray-500" />
              Home
            </Link>
            <Link 
              href="/documents" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <GitCompare className="mr-3 h-5 w-5 text-gray-500" />
              Comparison
            </Link>
            <Link 
              href="/results" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
              Results
            </Link>
            <Link 
              href="/projects" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <FileText className="mr-3 h-5 w-5 text-gray-500" />
              Projects
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-500" />
              Settings
            </Link>
            <Link 
              href="/learn-more" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <HelpCircle className="mr-3 h-5 w-5 text-gray-500" />
              Learn More
            </Link>
          </div>
        </nav>
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-col items-start space-y-2">
              <div className="text-sm font-medium">{user.email}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="flex items-center text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile header */}
      <div className="md:hidden w-full bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <Link href="/">
          <RankCentralLogo size={32} />
        </Link>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <GitCompare className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/results">
              <BarChart3 className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/learn-more">
              <HelpCircle className="h-5 w-5" />
            </Link>
          </Button>
          {user && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout} 
              className="text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
