import React from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, userRole }) => {
  // Define navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Profile', href: '/profile' },
      { name: 'Settings', href: '/settings' },
    ];
    
    const roleSpecificItems: Record<string, any[]> = {
      homeowner: [
        { name: 'My Projects', href: '/projects' },
        { name: 'New Assessment', href: '/assessments/new' },
        { name: 'Claims', href: '/claims' },
        { name: 'Payments', href: '/payments' },
      ],
      contractor: [
        { name: 'Jobs', href: '/jobs' },
        { name: 'Estimates', href: '/estimates' },
        { name: 'Schedule', href: '/schedule' },
        { name: 'Clients', href: '/clients' },
        { name: 'Materials', href: '/materials' },
        { name: 'Invoices', href: '/invoices' },
      ],
      supplier: [
        { name: 'Inventory', href: '/inventory' },
        { name: 'Orders', href: '/orders' },
        { name: 'Deliveries', href: '/deliveries' },
        { name: 'Customers', href: '/customers' },
      ],
      insurance: [
        { name: 'Claims', href: '/claims' },
        { name: 'Assessments', href: '/assessments' },
        { name: 'Approvals', href: '/approvals' },
        { name: 'Clients', href: '/clients' },
        { name: 'Reports', href: '/reports' },
      ],
    };
    
    return [...commonItems, ...roleSpecificItems[userRole]];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <div className="text-xl font-semibold text-primary">OrPaynter</div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="px-4 py-2">
            <div className="space-y-1">
              {getNavItems().map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral hover:bg-primary-light hover:text-white"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </nav>
        </div>
        
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            className="block w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            onClick={() => {/* Logout logic */}}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
