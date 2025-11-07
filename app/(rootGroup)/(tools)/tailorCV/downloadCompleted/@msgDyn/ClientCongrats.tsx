'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
//import Head from 'next/head';

type Props = {
  username: string;
};

export default function ClientCongrats({ username }: Props) {
  const router = useRouter();
/*
  useEffect(() => {
    document.title = `Success – Task Completed | YourAppName`;
  }, []);
*/ 

  return (
    <>      
      <main
        role="main"
        className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg"
      >
        <article
          aria-labelledby="congrats-title"
          className="text-center"
        >
          <h1
            id="congrats-title"
            className="text-3xl font-bold mb-4 text-blue-700"
          >
            🎉 Well done, {username}!
          </h1>

          <p className="text-lg mb-6 text-gray-700">
            You&#39;ve completed your task successfully.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.replace('/tailorCV/home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Again
            </button>

            <button
              onClick={() => router.replace('/')}
              className="px-4 py-2 bg-gray-300 text-black rounded-xl hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Go Home
            </button>
          </div>
        </article>
      </main>
    </>
  );
}
