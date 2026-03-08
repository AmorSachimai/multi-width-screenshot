import { WidthManager } from "./components/WidthManager";
import { useCaptureStatus } from "./hooks/useCaptureStatus";

function App() {
  const { status, settings, saveSettings, startCapture, resetStatus } =
    useCaptureStatus();

  return (
    <div className="w-[360px] min-h-[480px] bg-[#0c0c0e] text-white p-6 font-sans selection:bg-purple-500/30">
      <header className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Multi-Capture
        </h1>
        <p className="text-gray-400 text-[11px]">
          Automated Responsive Screenshots
        </p>
      </header>

      <main className="space-y-6">
        {status.type === "IDLE" && (
          <div className="flex flex-col space-y-6">
            {settings && (
              <WidthManager
                availableWidths={settings.availableWidths}
                selectedWidths={settings.selectedWidths}
                onChange={(available, selected) =>
                  saveSettings({
                    ...settings,
                    availableWidths: available,
                    selectedWidths: selected,
                  })
                }
              />
            )}

            <button
              type="button"
              onClick={startCapture}
              disabled={!settings || settings.selectedWidths.length === 0}
              className="group relative w-full py-4 bg-white text-black font-bold rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-600 disabled:hover:scale-100"
            >
              <span className="relative z-10">Start Capture Flow</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
            <div className="text-[10px] text-center text-gray-600">
              We will resize your window and capture the full page for each
              selected width.
            </div>
          </div>
        )}

        {status.type === "PROCESSING" && (
          <div className="space-y-4 py-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-purple-300">
                Capturing {status.currentWidth}px...
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(status.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center space-x-2 pt-4">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {status.type === "ZIPPING" && (
          <div className="space-y-4 py-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-pink-300">
                Creating Archive...
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(status.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-center text-gray-500">
              Optimizing and compressing images...
            </p>
          </div>
        )}

        {status.type === "SUCCESS" && (
          <div className="flex flex-col items-center py-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Success</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Capture Complete!</h2>
              <p className="text-sm text-gray-400 mt-1">
                All screenshots are ready.
              </p>
              <p className="text-xs text-purple-400 mt-2 font-medium animate-pulse">
                Your ZIP archive should start downloading automatically...
              </p>
            </div>
            <button
              type="button"
              onClick={resetStatus}
              className="w-full text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Start New Batch
            </button>
          </div>
        )}

        {status.type === "ERROR" && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-red-400 text-sm font-medium mb-1">
              Process Failed
            </div>
            <div className="text-red-300/80 text-xs mb-4">{status.message}</div>
            <button
              type="button"
              onClick={resetStatus}
              className="px-4 py-2 bg-red-500 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Reset and Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-8 border-t border-white/5 text-[10px] text-gray-600 flex justify-between">
        <span>v1.0.0</span>
        <span>Premium Web Capture</span>
      </footer>
    </div>
  );
}

export default App;
