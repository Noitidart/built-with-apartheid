'use client';

import { getCurrentUserId } from '@/utils/user-utils';
// import axios from 'axios';
// import { sendUnethicalSiteAlert } from '@/lib/email';
import { Bell, BellOff, Mail, Shield, X } from 'lucide-react';
import React, { useState } from 'react';

interface WatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  site: string;
  siteId: number;
  currentEmail: string;
  isCurrentlyWatching: boolean;
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
    // const response = await axios.post('/api/v1/send-email', requestBody);

    const response = await fetch('/api/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (response.ok) {
      alert('Email sent'); // to do replace with better alert
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
  // to do implement passing this in dynamically
  isCurrentlyWatching = false
}) => {
  const [watchType, setWatchType] = useState(
    isCurrentlyWatching ? 'subscribed' : 'not-subscribed'
  );
  const [email, setEmail] = useState(currentEmail);

  if (!isOpen) return null;

  const handleWatch = async (websiteId: number) => {
    // to review, having these as strings prob increases errors
    if (watchType === 'subscribed') {
      try {
        const userId = getCurrentUserId();
        console.log(userId);
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
          alert('saved');
          onClose();

          // setIsWatching(true);
        } else alert('something went wrong');
      } catch (error) {
        console.error('Failed to watch site:', error);
        alert('Failed to watch site');
      }
    } else if (watchType == 'not-subscribed') {
      // to do implement unwatching
      alert('not implemented');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Watch Site Security
          </h2>
          <button
            title="closeButton"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Site Info */}
          <div className="bg-slate-700/50 rounded-md p-3">
            <div className="text-sm text-slate-300 mb-1">Monitoring</div>
            <div className="text-white font-medium">{site}</div>
          </div>

          {/* Watch Options */}
          <div className="space-y-3">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Settings
            </h3>

            {/* Not Subscribed */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="watchType"
                value="not-subscribed"
                checked={watchType === 'not-subscribed'}
                onChange={(e) => setWatchType(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 bg-slate-700"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white group-hover:text-blue-200 transition-colors">
                  <BellOff className="w-4 h-4" />
                  <span className="font-medium">Not watching</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {
                    "Only receive notifications if you're mentioned or participate in discussions."
                  }
                </p>
              </div>
            </label>

            {/* Subscribed */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="watchType"
                value="subscribed"
                checked={watchType === 'subscribed'}
                onChange={(e) => setWatchType(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-500 border-slate-600 focus:ring-blue-500 focus:ring-2 bg-slate-700"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white group-hover:text-blue-200 transition-colors">
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">Watch all activity</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Receive notifications for all security changes and
                  vulnerabilities detected on this site.
                </p>
              </div>
            </label>
          </div>

          {/* Email Input (show when subscribed or custom) */}
          {(watchType === 'subscribed' || watchType === 'custom') && (
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

          {/* Privacy Notice */}
          <div className="bg-slate-700/30 rounded-md p-3 text-xs text-slate-400">
            <p>
              🔒 Your email will only be used for security notifications about
              this site. You can unsubscribe at any time from any notification
              email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleWatch(siteId)}
            disabled={
              (watchType === 'subscribed' || watchType === 'custom') &&
              !email?.includes('@')
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchDialog;
