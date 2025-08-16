import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/privacy-policy" className="text-gray-500 hover:text-gray-700">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="text-gray-500 hover:text-gray-700">
            Terms of Service
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-700">
            Contact
          </Link>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} Oliver's Roofing and Contracting LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
