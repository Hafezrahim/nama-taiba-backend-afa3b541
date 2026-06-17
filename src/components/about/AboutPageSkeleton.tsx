
import React from 'react';

const AboutPageSkeleton = () => {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};

export default AboutPageSkeleton;
