import React from 'react';
import ThreadBackground from '../components/ThreadBackground';

export default function CommunityFeed() {
  return (
    <>
      <ThreadBackground />
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-5xl font-bold text-center text-green-400 mb-6 animate-pulse">
          Coming Soon!
        </h1>
        <p className="text-xl text-center mb-8">
          We're brewing something special for our community.
        </p>
        <p className="text-lg text-center max-w-prose">
          Get ready to share your culinary creations, discover new recipes from fellow foodies, and connect with a vibrant community of cooking enthusiasts.
        </p>
        <div className="mt-10">
          <p className="text-gray-500 text-2xl">Stay tuned for updates!</p>
        </div>
      </div>
    </>
  );
}
