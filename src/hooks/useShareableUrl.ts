import { useCallback, useState } from 'react';

export interface ShareableUrlState {
  /** Copy current URL with step to clipboard */
  copyUrl: () => Promise<void>;
  /** Whether URL was recently copied */
  copied: boolean;
  /** Get shareable URL for current state */
  getUrl: () => string;
}

/**
 * Hook for generating and copying shareable URLs
 * 
 * @param storyId - Current story identifier
 * @param stepIndex - Current step index
 */
export function useShareableUrl(storyId: string, stepIndex: number): ShareableUrlState {
  const [copied, setCopied] = useState(false);

  const getUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('story', storyId);
    url.searchParams.set('step', String(stepIndex));
    return url.toString();
  }, [storyId, stepIndex]);

  const copyUrl = useCallback(async () => {
    const url = getUrl();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback: select and copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getUrl]);

  return {
    copyUrl,
    copied,
    getUrl,
  };
}

export default useShareableUrl;
