"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAManualInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                        (window.navigator as any).standalone;
    
    if (isStandalone) {
      // Defer state update to avoid synchronous React render warning
      setTimeout(() => setIsInstalled(true), 0);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default here if we want the browser banner too, 
      // but usually we do to control the UI.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt, maybe show a hint for iOS or other browsers
      alert("Untuk menginstall di HP:\n\nAndroid: Klik titik tiga di pojok kanan atas browser, lalu pilih 'Install App'.\n\niOS: Klik tombol Share (kotak panah atas), lalu cari 'Add to Home Screen'.");
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <div className="px-3 py-4 mt-auto border-t">
      <Button 
        onClick={handleInstallClick}
        variant="outline" 
        className="w-full justify-start gap-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      >
        <Download className="h-4 w-4" />
        <span>Install Aplikasi</span>
      </Button>
    </div>
  );
}
