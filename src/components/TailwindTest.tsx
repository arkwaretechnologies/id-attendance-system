'use client';

import React from 'react';

export default function TailwindTest() {
  return (
    <div className="p-8 bg-blue-500 text-white rounded-lg shadow-lg">
      <h1>Tailwind Test</h1>
      <p className="text-lg">
        If you can see blue background and white text, Tailwind is working!
      </p>
      <button className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 rounded transition-colors">
        Test Button
      </button>
    </div>
  );
}
