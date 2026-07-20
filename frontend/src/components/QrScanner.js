import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QrScanner.css';

const CONTAINER_ID = 'aquamom-qr-reader';

// Wraps html5-qrcode to provide continuous camera scanning.
// Calls onResult(decodedText) each time a QR code is decoded, and
// onError(message) if the camera cannot be accessed at all.
export default function QrScanner({ onResult, onError, paused }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const lastCodeRef = useRef({ code: null, time: 0 });

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(CONTAINER_ID);
    scannerRef.current = html5QrCode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          onError && onError('No camera device was found on this device.');
          return;
        }
        const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
        const cameraId = (backCamera || devices[0]).id;

        html5QrCode
          .start(
            cameraId,
            { fps: 10, qrbox: 240 },
            (decodedText) => {
              const now = Date.now();
              // Ignore duplicate reads of the same code within 3 seconds.
              if (lastCodeRef.current.code === decodedText && now - lastCodeRef.current.time < 3000) {
                return;
              }
              lastCodeRef.current = { code: decodedText, time: now };
              onResult(decodedText);
            },
            () => {
              // Called continuously while no QR code is in frame; ignore.
            }
          )
          .then(() => {
            runningRef.current = true;
          })
          .catch((err) => {
            onError && onError(err?.message || 'Unable to start the camera.');
          });
      })
      .catch((err) => {
        onError && onError(err?.message || 'Camera access was denied.');
      });

    return () => {
      if (runningRef.current && scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current && scannerRef.current.clear())
          .catch(() => {});
        runningRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="qr-reader-wrap">
      <div id={CONTAINER_ID} className="qr-reader" />
      {paused && <div className="qr-reader-overlay">Scanning paused</div>}
    </div>
  );
}
