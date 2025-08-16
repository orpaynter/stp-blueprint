import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  userRole?: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  userRole = 'contractor' 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userRole={userRole} 
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar 
          onMenuButtonClick={toggleSidebar} 
          userRole={userRole} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
