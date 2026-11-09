import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const AndroidApkDownloadButton: React.FC = () => {
  const [isAndroidWeb, setIsAndroidWeb] = useState(false);

  useEffect(() => {
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const isAndroid = /Android/i.test(ua);
      const isNative = Boolean(
        typeof window !== 'undefined' &&
          (typeof (window as any).Capacitor?.isNativePlatform === 'function'
            ? (window as any).Capacitor.isNativePlatform()
            : Boolean((window as any).Capacitor?.isNativePlatform))
      );

      if (isAndroid && !isNative) {
        setIsAndroidWeb(true);
      }
    } catch {
      // safe fallback
    }
  }, []);

  if (!isAndroidWeb) {
    return null;
  }

  return (
    <a
      href="https://github.com/theeequint/DevSpend/releases/latest/download/DevSpend.apk"
      download="DevSpend.apk"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-all shadow-sm shrink-0"
      title="Download DevSpend Android App (.apk)"
    >
      <Download size={13} className="shrink-0" />
      <span className="font-medium whitespace-nowrap">Download APK</span>
    </a>
  );
};

export default AndroidApkDownloadButton;
