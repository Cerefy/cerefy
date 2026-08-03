import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080a] text-zinc-100 font-sans">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-400 mb-4">404</h1>
        <p className="text-xl mb-6">Page not found</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
