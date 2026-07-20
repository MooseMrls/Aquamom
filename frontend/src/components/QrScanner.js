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
    let active = true;
    let html5QrCode = null;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!active) return;
        if (!devices || devices.length === 0) {
          onError && onError('No camera device was found on this device.');
          return;
        }
        const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
        const cameraId = (backCamera || devices[0]).id;

        html5QrCode = new Html5Qrcode(CONTAINER_ID);
        scannerRef.current = html5QrCode;

        return html5QrCode.start(
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
        );
      })
      .then(() => {
        if (!active) {
          if (html5QrCode) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
          }
        } else {
          runningRef.current = true;
        }
      })
      .catch((err) => {
        if (active) {
          onError && onError(err?.message || 'Unable to start the camera.');
        }
      });

    return () => {
      active = false;
      if (html5QrCode) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {});
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
