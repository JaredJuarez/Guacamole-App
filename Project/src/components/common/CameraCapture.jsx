import { useRef, useState, useEffect } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "./Button";

export function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled)
          setError("No se pudo acceder a la cámara. Verifica los permisos.");
        return;
      }
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!cancelled) {
          streamRef.current = mediaStream;
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } else {
          mediaStream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        if (!cancelled)
          setError("No se pudo acceder a la cámara. Verifica los permisos.");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [restartKey]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setPhoto(dataUrl);
    if (onCapture) onCapture(dataUrl);
  };

  const retake = () => {
    setPhoto(null);
    setError(null);
    setRestartKey((k) => k + 1);
  };

  if (error) {
    return (
      <div className="bg-slate-100 rounded-2xl p-8 text-center">
        <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <Button variant="secondary" size="sm" onClick={retake}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (photo) {
    return (
      <div className="relative rounded-2xl overflow-hidden">
        <img src={photo} alt="Captura" className="w-full rounded-2xl" />
        <button
          onClick={retake}
          className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-2xl"
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={capturePhoto}
          className="w-16 h-16 bg-white rounded-full border-4 border-primary shadow-lg hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
        >
          <Camera className="w-7 h-7 text-primary" />
        </button>
      </div>
    </div>
  );
}
