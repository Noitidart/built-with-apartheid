'use client';

import { getCurrentUserId } from '@/utils/user-utils';
// import axios from 'axios';
// import { sendUnethicalSiteAlert } from '@/lib/email';
import { Mail, Shield, X } from 'lucide-react';
import React, { useState } from 'react';

interface WatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  site: string;
  siteId: number;
  currentEmail: string;
  isCurrentlyWatching: boolean;
  onWatchStatusChange?: (isWatching: boolean) => void;
}

export const tryEmailSend = async (email: string, site: string) => {
  // Handle save logic here
  try {
    const requestBody = {
      userEmail: email,
      userName: 'Test User',
      siteUrl: site
    };
    console.log(requestBody);

    const response = await fetch('/api/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      alert('Email sent');
    }
  } catch (error) {
    console.log(error);
  }
};

const WatchDialog: React.FC<WatchDialogProps> = ({
  isOpen,
  onClose,
  site,
  siteId,
  currentEmail = '',
  isCurrentlyWatching = false,
  onWatchStatusChange
}) => {
  const [email, setEmail] = useState(currentEmail);

  if (!isOpen) return null;

  const handleWatch = async (websiteId: number) => {
    try {
      const userId = getCurrentUserId();
      console.log(userId);

      if (isCurrentlyWatching) {
        // Unwatch site
        const response = await fetch('/api/v1/unwatch-site', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            websiteId,
            userId
          })
        });

        if (response.ok) {
          alert('Successfully unwatched site');
          onWatchStatusChange?.(false);
          onClose();
        } else {
          alert('Failed to unwatch site');
        }
      } else {
        // Watch site
        const response = await fetch('/api/v1/watch-site', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            websiteId,
            userId,
            email: email.trim() || undefined
          })
        });

        if (response.ok) {
          alert('Successfully watching site');
          onWatchStatusChange?.(true);
          onClose();
        } else {
          alert('Failed to watch site');
        }
      }
    } catch (error) {
      console.error('Failed to handle watch/unwatch:', error);
      alert('Failed to process your request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {isCurrentlyWatching ? 'Stop Watching Site' : 'Watch Site'}
          </h2>
          <button
            onClick={onClose}
            title="Close dialog"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Site Info */}
          <div className="bg-slate-700/50 rounded-md p-3">
            <div className="text-sm text-slate-300 mb-1">Monitoring</div>
            <div className="text-white font-medium">{site}</div>
          </div>

          {/* Email Input - Only show when not currently watching */}
          {!isCurrentlyWatching && (
            <div className="space-y-3">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Notifications
              </h3>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm text-slate-300 mb-2"
                >
                  Email address for notifications
                </label>
                <input
                  type="email"
                  id="email"
                  value={email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {
                    "We'll send security alerts and updates to this email address."
                  }
                </p>
              </div>
            </div>
          )}

          {/* Privacy Notice - Only show when not currently watching */}
          {!isCurrentlyWatching && (
            <div className="bg-slate-700/30 rounded-md p-3 text-xs text-slate-400">
              <p>
                🔒 Your email will only be used for security notifications about
                this site, including monthly recaps, calls to action, and
                important status changes. You can unsubscribe at any time from
                any notification email.
              </p>
            </div>
          )}

          {/* Unwatch Notice - Show when currently watching */}
          {isCurrentlyWatching && (
            <div className="bg-slate-700/30 rounded-md p-3 text-sm text-slate-300">
              <p>
                You are currently receiving email notifications for this site.
                Click the button below to stop watching this site and
                unsubscribe from notifications.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleWatch(siteId)}
            disabled={!isCurrentlyWatching && !email?.includes('@')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCurrentlyWatching ? 'Stop Watching' : 'Start Watching'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchDialog;
