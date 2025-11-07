'use client';

import { useState,useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import Head from 'next/head';
import { downloadData } from 'aws-amplify/storage';
import {useProgressStore} from '@/lib/stores/progressStore'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
//import { ScrollArea } from '@/components/ui/scroll-area';
//import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/client/MarkdownRenderer'
//import {useProgressStore} from '@/lib/stores/progressStore'

export default function DownloadPageClient({
  signedUrl,
  fileName,
}: {
  signedUrl: string;
  fileName: string;
}) {
  const [progress, setProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // — **new** states to hold the file’s text and a blob URL for a “Download TXT” button
  const [content, setContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  //const [initialized, setInitialized] = useState(false);

  const router = useRouter();

  useEffect(() => {
    useProgressStore.getState().reset();
    //useProgressStore.getState().reset();
  }, []);

   // Fetch content whenever signedUrl changes
  useEffect(() => {
    console.log('[DownloadPageClient] Props changed:', signedUrl, fileName);

    if (signedUrl === 'NOSET') {
      setContentError('Sorry, something went wrong generating your CV. Please try again.');
      return;
    }

    // Clear previous state
    setContentError(null);
    setContent(null);
    setBlobUrl(null);

    const fetchContent = async () => {
      try {
        const { body } = await downloadData({
          path: signedUrl,
          options: { bucket: 'mainBucket' },
        }).result;

        const text = await body.text();
        setContent(text);

        const txtBlob = new Blob([text], { type: 'text/plain' });
        setBlobUrl(URL.createObjectURL(txtBlob));
      } catch (err) {
        console.error('[DownloadPageClient] fetch error:', err);
        setContentError('Failed to load content.');
      }
    };

    fetchContent();
  }, [signedUrl, fileName]);


/*
  useEffect(() => {
    //document.title = `Download Ready – ${fileName}`
    useProgressStore.getState().reset()
  }, [])
*/
  const handleDownload = async () => {

    if (!signedUrl || !fileName) {
      //alert('Missing download metadata')
      return
    }

    try {
      //ctrlPrg.stop()
      console.log('[DownloadPageClient] Download started');
      setProgress(0);
      setDownloadComplete(false);
      setError(null);

      console.log('[DownloadPageClient] Calling downloadData with signedUrl:', signedUrl);

      const { body } = await downloadData({//`media/profile-pictures/${file.name}`
        path: signedUrl,
        options: {
          bucket: 'mainBucket',
          onProgress: (progressEvent) => {

            console.log('[DownloadPageClient] onProgress:', progressEvent);

            if (
              progressEvent.totalBytes !== undefined &&
              progressEvent.totalBytes > 0
            ) {
              const percentage =
                (progressEvent.transferredBytes / progressEvent.totalBytes) *
                100;
                console.log(`[DownloadPageClient] Progress: ${percentage.toFixed(2)}%`);
              setProgress(percentage);
            }
          },
        },
      }).result;

      console.log('[DownloadPageClient] Finished downloading data, converting to blob...');
      const blob = await body.blob();
      const url = URL.createObjectURL(blob);

      console.log('[DownloadPageClient] Blob URL created:', url);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[DownloadPageClient] File downloaded and link triggered');

      setDownloadComplete(true);

      // ✅ Pass signedUrl as param to route
      setTimeout(() => {
        console.log('[DownloadPageClient] Navigating to /tailorCV/downloadCompleted');
        router.replace('/tailorCV/downloadCompleted');
      }, 10);
      
    } catch (err) {
      console.error('[DownloadPageClient]::Download error:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  // 🔒 Prevent rendering until sessionStorage values are loaded

  return (
    <>      
      <main className="bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <Card className="shadow-lg dark:shadow-none">
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Your Tailored CV
            </h1>
          </CardHeader>

          <CardContent className="space-y-6">
            {contentError ? (
              <div className="space-y-4 text-center">
                <p className="text-red-600 dark:text-red-400">{contentError}</p>
                <Button
                  variant="outline"
                  onClick={() => router.replace('/tailorCV/home')}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <section aria-labelledby="file-content-heading">
                <h2 id="file-content-heading" className="sr-only">
                  File Content
                </h2>

                {content ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded max-h-64 overflow-auto bg-white dark:bg-gray-800">
                    <div className="p-4 text-sm text-gray-800 dark:text-gray-200">
                      <MarkdownRenderer
                        content={content}
                        useBreaks={true}           // single newlines -> <br/>
                        allowHtml="sanitize"       // safely allow a subset of HTML if present
                        prose={true}               // apply Tailwind Typography (if plugin enabled)
                      />
                    </div>
                  </div>
                ) : (
                  <p className="italic text-gray-600 dark:text-gray-400">
                    Loading content…
                  </p>
                )}

                {progress > 0 && progress < 100 && (
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Download Progress: {progress.toFixed(1)}%
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {downloadComplete && (
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Download complete!
                  </p>
                )}

                {error && (
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </p>
                )}
              </section>
            )}
          </CardContent>

          {/* Only show download buttons if content loaded without error */}
          {!contentError && (
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end">
              {blobUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = fileName
                      ? fileName.replace(/\.[^/.]+$/, '') + '.txt'
                      : 'file.txt';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(
                      () => router.replace('/tailorCV/downloadCompleted'),
                      10
                    );
                  }}
                >
                  Download .txt
                </Button>
              )}
              <Button onClick={handleDownload}>Start Download</Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </main>
    </>
  );
}