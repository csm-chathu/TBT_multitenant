import React, { useState, useEffect, useRef } from 'react';

const GOOGLE_SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1tZy5k3ENplfdqLEB4B39g1x0-P6KG5-5blGhctzIel0/edit?usp=sharing';
const GOOGLE_SHEET_EMBED_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1tZy5k3ENplfdqLEB4B39g1x0-P6KG5-5blGhctzIel0/edit?rm=minimal';
const GOOGLE_SHEET_PUBLISHED_EMBED_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSY9NxinCKIVBEUaYEw6KuDc_3Uh31ZFbLwuIEBi23Rlu2PjfUaKM9Q9TddxBZZU3WIuuxcYKSAy4Tu/pubhtml?widget=true&headers=false';

const AbcSheetIframe: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // Defaults to editable mode
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpenNewTab = () => {
    window.open(GOOGLE_SHEET_EDIT_URL, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey(Date.now());
  };

  const handleToggleEditMode = () => {
    setLoading(true);
    setIsEditMode((prev) => !prev);
    setIframeKey(Date.now());
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback: toggle CSS fullscreen state
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentIframeSrc = `${
    isEditMode ? GOOGLE_SHEET_EMBED_EDIT_URL : GOOGLE_SHEET_PUBLISHED_EMBED_URL
  }&_cb=${iframeKey}`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col space-y-3 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 bg-surface-secondary h-screen w-screen'
          : 'h-[calc(100vh-175px)]'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="bg-surface-primary px-4 py-3 rounded-lg border border-borderColor-secondary shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <span className="material-symbols-outlined text-2xl">table_chart</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-textColor-base leading-tight">ABC Sheet</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isEditMode ? 'Editable Mode' : 'View Only'}
              </span>
            </div>
            <p className="text-xs text-textColor-muted">
              Activity Breakdown &amp; Costing &bull; Google Spreadsheet Embed
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Edit / View Mode Toggle Button */}
          <button
            onClick={handleToggleEditMode}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-medium border rounded-md flex items-center gap-1.5 transition-colors ${
              isEditMode
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                : 'bg-surface-secondary hover:bg-surface-tertiary text-textColor-base border-borderColor-secondary'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            title={isEditMode ? 'Switch to read-only published view' : 'Enable inline editing'}
          >
            <span className="material-symbols-outlined text-sm">
              {isEditMode ? 'visibility' : 'edit'}
            </span>
            {isEditMode ? 'Switch to View Only' : 'Enable Editing'}
          </button>

          {/* Full Screen View Button */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-xs font-medium bg-surface-secondary hover:bg-surface-tertiary border border-borderColor-secondary rounded-md text-textColor-base flex items-center gap-1.5 transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
          >
            <span className="material-symbols-outlined text-sm">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-medium bg-surface-secondary hover:bg-surface-tertiary border border-borderColor-secondary rounded-md text-textColor-base flex items-center gap-1.5 transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="Reload Google Sheet embed"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin text-primary-500' : ''}`}>
              refresh
            </span>
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Open in Google Sheets Button */}
          <button
            onClick={handleOpenNewTab}
            className="px-3.5 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
            title="Open full sheet in new tab to edit"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Open in Google Sheets
          </button>
        </div>
      </div>

      {/* Main Content Area - Full Google Sheet Embed with Loader */}
      <div className="relative flex-1 w-full bg-surface-primary rounded-lg border border-borderColor-secondary shadow-sm overflow-hidden flex flex-col">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-primary/95 backdrop-blur-xs transition-opacity duration-200">
            <div className="relative flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-full border-3 border-primary-100 dark:border-primary-950/80 border-t-primary-500 animate-spin" />
              <span className="material-symbols-outlined text-primary-500 text-xl absolute">
                table_chart
              </span>
            </div>
            <p className="text-sm font-semibold text-textColor-base">Loading ABC Sheet...</p>
            <p className="text-xs text-textColor-muted mt-1">
              {isEditMode ? 'Loading interactive editor' : 'Fetching live Google Spreadsheet'}
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={currentIframeSrc}
          className={`w-full flex-1 border-0 h-full transition-opacity duration-300 ${
            loading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          allow="clipboard-read; clipboard-write; fullscreen"
          title="ABC Google Sheet"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default AbcSheetIframe;
