import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, userRole }) => {
  const pathname = usePathname();
  
  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const commonItems: NavItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: 'home' },
      { name: 'Profile', href: '/profile', icon: 'user' },
      { name: 'Settings', href: '/settings', icon: 'settings' },
    ];
    
    const roleSpecificItems: Record<string, NavItem[]> = {
      homeowner: [
        { name: 'My Projects', href: '/projects', icon: 'folder' },
        { name: 'New Assessment', href: '/assessments/new', icon: 'plus-circle' },
        { name: 'Claims', href: '/claims', icon: 'file-text' },
        { name: 'Payments', href: '/payments', icon: 'credit-card' },
      ],
      contractor: [
        { name: 'Jobs', href: '/jobs', icon: 'briefcase' },
        { name: 'Estimates', href: '/estimates', icon: 'calculator' },
        { name: 'Schedule', href: '/schedule', icon: 'calendar' },
        { name: 'Clients', href: '/clients', icon: 'users' },
        { name: 'Materials', href: '/materials', icon: 'package' },
        { name: 'Invoices', href: '/invoices', icon: 'file-text' },
      ],
      supplier: [
        { name: 'Inventory', href: '/inventory', icon: 'box' },
        { name: 'Orders', href: '/orders', icon: 'shopping-cart' },
        { name: 'Deliveries', href: '/deliveries', icon: 'truck' },
        { name: 'Customers', href: '/customers', icon: 'users' },
      ],
      insurance: [
        { name: 'Claims', href: '/claims', icon: 'file-text' },
        { name: 'Assessments', href: '/assessments', icon: 'search' },
        { name: 'Approvals', href: '/approvals', icon: 'check-circle' },
        { name: 'Clients', href: '/clients', icon: 'users' },
        { name: 'Reports', href: '/reports', icon: 'bar-chart' },
      ],
    };
    
    return [...commonItems, ...roleSpecificItems[userRole]];
  };
  
  const navItems = getNavItems();
  
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-primary">
          <span className="text-white text-xl font-semibold">OrPaynter</span>
        </div>
        
        <div className="px-4 py-2 bg-primary-light text-white">
          <div className="text-sm">Logged in as</div>
          <div className="font-medium capitalize">{userRole}</div>
        </div>
        
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-neutral hover:bg-primary-light hover:text-white'
                  }`}
                >
                  <span className="mr-3">{/* Icon would go here */}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full">
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              className="flex items-center w-full px-2 py-2 text-base font-medium text-red-600 rounded-md hover:bg-red-100"
              onClick={() => {/* Logout logic */}}
            >
              <span className="mr-3">{/* Logout icon */}</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
