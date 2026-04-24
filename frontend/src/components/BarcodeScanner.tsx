import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    // 2 corresponds to Html5QrcodeScannerState.SCANNING
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === 2) { 
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0
    };

    // Start the camera immediately
    html5QrCode.start(
      { facingMode: "environment" }, 
      config, 
      (decodedText) => {
        onScan(decodedText);
        // We stop after one successful scan for POS
        void stopScanner();
      },
      () => {
        // error (ignored)
      }
    ).catch(err => {
      console.error("Unable to start scanner", err);
    });

    return () => {
      void stopScanner();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-blur-fade">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        <header className="px-8 py-5 border-b border-zinc-100 bg-white flex justify-between items-center">
           <div>
              <h3 className="text-xs font-bold text-zinc-800">Scanner active</h3>
              <p className="text-[9px] font-bold text-zinc-400 mt-1">Camera is ready</p>
           </div>
           <button 
             onClick={onClose} 
             className="p-3 bg-zinc-50 text-zinc-400 hover:text-rose-500 rounded-xl transition-all active:scale-95"
             title="Close Scanner"
           >
             <X className="w-5 h-5" />
           </button>
        </header>
        <div id="reader" className="w-full bg-black aspect-video"></div>
        <div className="p-8 text-center bg-zinc-50/50 space-y-6">
            <p className="text-[10px] font-bold text-zinc-400 animate-pulse">Position barcode within the frame</p>
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Close Camera
            </button>
        </div>
      </div>
    </div>
  );
}
