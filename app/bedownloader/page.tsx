import type { Metadata } from 'next';
import BeDownloaderClient from './BeDownloaderClient';

export const metadata: Metadata = {
  title: 'BeDownloader',
  description: 'Download public Behance project assets in original quality.',
  alternates: {
    canonical: '/bedownloader'
  },
  openGraph: {
    title: 'BeDownloader',
    description: 'Download public Behance project assets in original quality.',
    url: '/bedownloader',
    type: 'website'
  }
};

export default function BeDownloaderPage() {
  return <BeDownloaderClient />;
}
