import React from 'react';
import Link from 'next/link';

interface NavbarProps {
  onMenuButtonClick: () => void;
  userRole: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

const Navbar: React.FC<NavbarProps> = ({ onMenuButtonClick, userRole }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral hover:text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={onMenuButtonClick}
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu icon */}
              <svg
                className="block h-6 w-6"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center md:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-primary text-xl font-bold hidden md:block">OrPaynter</span>
                <span className="text-primary text-xl font-bold md:hidden">OP</span>
              </Link>
            </div>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {/* Desktop navigation links */}
              <Link
                href="/dashboard"
                className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              
              {userRole === 'contractor' && (
                <>
                  <Link
                    href="/jobs"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Jobs
                  </Link>
                  <Link
                    href="/schedule"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Schedule
                  </Link>
                </>
              )}
              
              {userRole === 'homeowner' && (
                <>
                  <Link
                    href="/projects"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Projects
                  </Link>
                  <Link
                    href="/claims"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Claims
                  </Link>
                </>
              )}
              
              {userRole === 'supplier' && (
                <>
                  <Link
                    href="/inventory"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Inventory
                  </Link>
                  <Link
                    href="/orders"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Orders
                  </Link>
                </>
              )}
              
              {userRole === 'insurance' && (
                <>
                  <Link
                    href="/claims"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Claims
                  </Link>
                  <Link
                    href="/assessments"
                    className="border-transparent text-neutral hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Assessments
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              {/* Notification bell */}
              <button
                type="button"
                className="bg-white p-1 rounded-full text-neutral hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">View notifications</span>
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-sm font-medium">OP</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
