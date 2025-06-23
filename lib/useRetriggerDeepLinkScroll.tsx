/**
 * Deep links in React applications often don't work as expected because the target
 * elements (like posts in a timeline) don't mount immediately. By the time the timeline
 * loads and renders, the browser has already processed the hash and won't retrigger
 * the scroll. This hook solves that problem by manually checking for and scrolling
 * to the deep-linked element after React components have mounted.
 */

import Spinner from '@/components/Spinner';
import { useEffect, useState } from 'react';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __lastAnchorScrolledTo?: string;
  }
}

const USER_GETS_ANTSY_FOR_SCROLL_AFTER_MS = 1_000;
const USER_GIVES_UP_FOR_SCROLL_AFTER_MS = 10_000;
/**
 * Hook that retriggers deep link scrolling after React components mount.
 * It reads the anchor from the URL hash and waits for the element to appear in the DOM.
 * Only scrolls once per anchor to avoid repeated scrolling.
 * Returns a modal element to display while waiting for the scroll target.
 */
export function useRetriggerDeepLinkScroll(
  // A modal shows with this message until the scroll is triggered.
  message: string
) {
  const [showWaitingModal, setShowWaitingModal] = useState(false);

  useEffect(
    function scrollToAnchorIfPresentOnMount() {
      const hash = window.location.hash;
      if (!hash) {
        return;
      }

      const anchorId = hash.slice(1); // Remove the # prefix

      // Check if we've already scrolled to this anchor
      if (window.__lastAnchorScrolledTo === anchorId) {
        return;
      }

      // Function to check if element exists and scroll to it
      const didFindAndScrollToElement = function didFindAndScrollToElement() {
        const element = document.getElementById(anchorId);

        if (!element) {
          return false;
        }

        // Mark that we've scrolled to this anchor
        window.__lastAnchorScrolledTo = anchorId;

        // Hide modal if showing
        setShowWaitingModal(false);

        // Scroll to the element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Return true to indicate we found and scrolled
        return true;
      };

      // Try immediately
      if (didFindAndScrollToElement()) {
        return;
      }

      // Give the doc a chance to render, if it renders within
      // `USER_GETS_ANTSY_FOR_SCROLL_AFTER_MS`, we don't need to show the modal.
      const modalTimeout = setTimeout(
        function showModalAfterUserGetsAntsyWaitingForScroll() {
          setShowWaitingModal(true);
          console.log('showModalAfterUserGetsAntsyWaitingForScroll');
        },
        USER_GETS_ANTSY_FOR_SCROLL_AFTER_MS
      );

      // If not found, set up an observer to wait for it
      const observer = new MutationObserver(
        function tryFindingAndScrollingToElementOnSubtreeChange() {
          if (!didFindAndScrollToElement()) {
            return;
          }

          // Found and scrolled, disconnect observer
          observer.disconnect();
          clearTimeout(modalTimeout);
        }
      );

      // Start observing the document for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Set a timeout to stop observing after 10 seconds
      const timeout = setTimeout(() => {
        observer.disconnect();
        setShowWaitingModal(false);
      }, USER_GIVES_UP_FOR_SCROLL_AFTER_MS);

      // Cleanup function
      return () => {
        observer.disconnect();
        clearTimeout(timeout);
        clearTimeout(modalTimeout);
        setShowWaitingModal(false);
      };
    },
    [] // Only run on mount
  );

  // Modal element to display while waiting
  const waitingToScrollModal = showWaitingModal ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <Spinner size="lg" color="blue" />

          <p className="text-gray-700 dark:text-gray-300 text-center text-lg">
            {message}
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return { waitingToScrollModal };
}
