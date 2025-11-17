
import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const MockDataBanner = () => {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 p-4 m-6 rounded-r-md" role="alert">
      <div className="flex items-center">
        <InformationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
        <div>
          <p className="font-bold">Development Mode</p>
          <p className="text-sm">Could not connect to the live server. You are viewing static mock data.</p>
        </div>
      </div>
    </div>
  );
};

export default MockDataBanner;
