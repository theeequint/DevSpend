import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const AndroidApkDownloadButton: React.FC = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    try {
      const native = Boolean(
        typeof window !== 'undefined' &&
          (typeof (window as any).Capacitor?.isNativePlatform === 'function'
            ? (window as any).Capacitor.isNativePlatform()
            : Boolean((window as any).Capacitor?.isNativePlatform))
      );
      setIsNative(native);
    } catch {
      // safe fallback
    }
  }, []);

  if (isNative) {
    return null;
  }

  return (
    <a
      href="https://github.com/theeequint/DevSpend/releases/download/latest-apk/DevSpend.apk"
      download="DevSpend.apk"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex lg:hidden items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all shadow-sm shrink-0 whitespace-nowrap"
      title="Download DevSpend Android App (.apk)"
    >
      <Download size={13} className="shrink-0" />
      <span>Download APK</span>
    </a>
  );
};

export default AndroidApkDownloadButton;
