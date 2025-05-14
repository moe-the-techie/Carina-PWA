import React from 'react';
import PageFade from '../components/PageFade';

export default function HomePage() {

  return (
    <PageFade>
    <div className="h-[90vh] flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-blue-600 mb-4">
          Chat Page. (Under Construction)
        </h1>
      </div>
    </div>
    </PageFade>
  );
}
