import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Weight, AlertCircle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Spinner } from "../common/Spinner";
import { Modal } from "../common/Modal";
import { CameraCapture } from "../common/CameraCapture";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import {
  mintToBlockchain,
  generateLoteId,
  generateHash,
} from "../../utils/blockchain";
import { extractGPSFromImage } from "../../utils/exifExtractor";

export default function CaptureBatch() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { addToast } = useToast();

  const [photo, setPhoto] = useState(null);
  const [extractedGPS, setExtractedGPS] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [weight, setWeight] = useState("");
  const [minting, setMinting] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [newLote, setNewLote] = useState(null);

  const tryGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalización no disponible.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setExtractedGPS({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
        addToast("Ubicación GPS obtenida", "success");
      },
      () => {
        setGpsLoading(false);
        setGpsError(
          "GPS no disponible. El lote se registrará sin coordenadas.",
        );
        addToast("Sin GPS. Puedes continuar sin ubicación.", "info");
      },
      { timeout: 8000 },
    );
  };

  const handleCapture = async (dataUrl) => {
    setPhoto(dataUrl);
    // Try EXIF GPS first
    const gps = await extractGPSFromImage(dataUrl);
    if (gps) {
      setExtractedGPS(gps);
      setGpsError(null);
      addToast("Ubicación extraída del EXIF", "success");
      return;
    }
    // Fallback: browser Geolocation API
    tryGeolocation();
  };

  const handleMint = async () => {
    if (!photo) {
      addToast("Captura una foto del lote primero", "error");
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      addToast("Ingresa un peso válido", "error");
      return;
    }
    setMinting(true);
    try {
      const loteId = generateLoteId();
      const photoHash = await generateHash(
        photo.substring(0, 100) + Date.now(),
      );

      const result = await mintToBlockchain({
        type: "batch",
        loteId,
        weight: parseFloat(weight),
        lat: extractedGPS?.lat ?? null,
        lng: extractedGPS?.lng ?? null,
        photoHash,
      });

      const lote = {
        id: loteId,
        photoUrl: photo,
        lat: extractedGPS?.lat ?? null,
        lng: extractedGPS?.lng ?? null,
        weight: parseFloat(weight),
        txHash: result.txHash,
        photoHash,
        timestamp: result.timestamp,
        status: "Cosechado",
        qrData: JSON.stringify({ loteId, txHash: result.txHash }),
        reception: null,
      };

      dispatch({ type: "ADD_LOTE", payload: lote });
      setNewLote(lote);
      setQrModal(true);
      addToast("¡NFT de lote generado exitosamente!", "success");
    } catch {
      addToast("Error al generar el NFT", "error");
    } finally {
      setMinting(false);
    }
  };

  if (minting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner text="Generando NFT del lote en blockchain..." />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Nueva Cosecha
        </h1>
        <p className="text-slate-500 text-sm">
          Captura evidencia fotográfica del lote
        </p>
      </div>

      {/* Camera */}
      <div className="mb-5">
        <CameraCapture onCapture={handleCapture} />
      </div>

      {/* Photo preview */}
      {photo && (
        <Card className="mb-5">
          <img
            src={photo}
            alt="Captured batch"
            className="w-full h-40 object-cover rounded-xl"
          />
        </Card>
      )}

      {/* GPS info - Success */}
      {extractedGPS && !gpsError && (
        <Card className="mb-5 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-900">
                ✓ Ubicación extraída del EXIF
              </p>
              <p className="text-green-700">
                {extractedGPS.lat.toFixed(6)}, {extractedGPS.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* GPS loading */}
      {gpsLoading && (
        <Card className="mb-5 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
            <p className="text-sm text-blue-700">Obteniendo ubicación GPS...</p>
          </div>
        </Card>
      )}

      {/* GPS info - Error */}
      {gpsError && !gpsLoading && (
        <Card className="mb-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Sin GPS</p>
              <p className="text-amber-700 text-xs">{gpsError}</p>
              <button
                type="button"
                onClick={tryGeolocation}
                className="mt-1 text-amber-800 underline text-xs font-semibold"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Weight form */}
      <Card className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <Weight className="w-4 h-4 inline mr-1" />
          Peso Estimado (kg)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Ej: 250"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
        />
      </Card>

      {/* Mint button */}
      <Button
        onClick={handleMint}
        className="w-full"
        size="lg"
        disabled={!photo || !weight || parseFloat(weight) <= 0}
      >
        <Package className="w-5 h-5 mr-2" /> Generar NFT de Lote
      </Button>

      {/* QR Modal */}
      <Modal
        isOpen={qrModal}
        onClose={() => {
          setQrModal(false);
          navigate("/app/dashboard");
        }}
        title="Lote Registrado"
      >
        {newLote && (
          <div className="text-center">
            <div className="bg-green-50 rounded-2xl p-6 mb-5 inline-block">
              <QRCodeSVG value={newLote.qrData} size={200} level="H" />
            </div>
            <p className="font-bold text-slate-900 mb-1">{newLote.id}</p>
            <p className="text-xs text-slate-400 mb-4 break-all font-mono">
              TX: {newLote.txHash.substring(0, 24)}...
            </p>
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 space-y-1">
              <p>
                <strong>Peso:</strong> {newLote.weight} kg
              </p>
              <p>
                <strong>Estado:</strong> Cosechado
              </p>
              {newLote.lat && (
                <p>
                  <strong>GPS:</strong> {newLote.lat.toFixed(4)},{" "}
                  {newLote.lng.toFixed(4)}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                setQrModal(false);
                navigate("/app/dashboard");
              }}
              className="w-full mt-5"
            >
              Ir al Dashboard
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
