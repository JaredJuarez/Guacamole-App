import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Leaf, Loader2, Camera, AlertCircle } from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Spinner } from "../common/Spinner";
import { CameraCapture } from "../common/CameraCapture";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { mintToBlockchain } from "../../utils/blockchain";
import { extractGPSFromImage } from "../../utils/exifExtractor";

export default function RegisterOrchard() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { addToast } = useToast();

  const [step, setStep] = useState("camera"); // camera | form
  const [photoData, setPhotoData] = useState(null);
  const [extractedGPS, setExtractedGPS] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [form, setForm] = useState({ name: "", owner: "" });
  const [minting, setMinting] = useState(false);

  const handlePhotoCapture = async (dataUrl) => {
    setPhotoData(dataUrl);

    // Intentar extraer GPS de EXIF
    const gps = await extractGPSFromImage(dataUrl);
    if (gps) {
      setExtractedGPS(gps);
      setGpsError(null);
      addToast("✓ Ubicación extraída del EXIF de la foto", "success");
    } else {
      setExtractedGPS(null);
      setGpsError(
        "No se encontraron coordenadas GPS en la foto. Asegúrate de que el GPS esté habilitado en tu dispositivo.",
      );
      addToast(
        "⚠ No se encontró GPS en los metadatos. Por favor, retoma la foto con GPS habilitado.",
        "error",
      );
    }

    setStep("form");
  };

  const handleRetake = () => {
    setPhotoData(null);
    setExtractedGPS(null);
    setGpsError(null);
    setStep("camera");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.owner) {
      addToast("Completa todos los campos", "error");
      return;
    }

    if (!extractedGPS) {
      addToast("Se requieren coordenadas GPS de la foto", "error");
      return;
    }

    setMinting(true);
    try {
      const result = await mintToBlockchain({
        type: "orchard",
        name: form.name,
        owner: form.owner,
        lat: extractedGPS.lat,
        lng: extractedGPS.lng,
      });

      dispatch({
        type: "REGISTER_ORCHARD",
        payload: {
          id: result.txHash.substring(0, 12),
          name: form.name,
          owner: form.owner,
          lat: extractedGPS.lat,
          lng: extractedGPS.lng,
          photoUrl: photoData,
          txHash: result.txHash,
          timestamp: result.timestamp,
        },
      });

      addToast("¡Huerta registrada exitosamente en blockchain!", "success");
      navigate("/app/dashboard");
    } catch {
      addToast("Error al registrar huerta", "error");
    } finally {
      setMinting(false);
    }
  };

  if (minting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner text="Registrando huerta en la blockchain..." />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Registra tu Huerta
        </h1>
        <p className="text-slate-500 text-sm">
          Crea una identidad digital verificable para tu huerta
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "camera" ? "bg-primary text-white" : "bg-green-100 text-primary"}`}
          >
            <Camera className="w-4 h-4" />
          </div>
          <div
            className={`h-0.5 w-8 ${step === "form" ? "bg-primary" : "bg-slate-200"}`}
          />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "form" ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}
          >
            2
          </div>
        </div>
      </div>

      {/* PASO 1: Captura de foto */}
      {step === "camera" && (
        <div>
          <Card className="mb-4">
            <p className="text-sm text-slate-600 mb-3">
              Toma una foto clara de tu huerta. Asegúrate de que el{" "}
              <strong>GPS esté habilitado</strong> en tu dispositivo para
              extraer automáticamente la ubicación.
            </p>
          </Card>
          <CameraCapture onCapture={handlePhotoCapture} />
        </div>
      )}

      {/* PASO 2: Formulario de datos */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview foto + GPS */}
          <Card className="bg-slate-50 border-slate-200">
            <div className="space-y-3">
              {photoData && (
                <img
                  src={photoData}
                  alt="Foto huerta"
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}

              {extractedGPS && (
                <div className="flex items-start gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-primary">
                      Ubicación capturada del EXIF
                    </p>
                    <p className="text-slate-600 font-mono text-xs break-all">
                      {extractedGPS.lat.toFixed(6)},{" "}
                      {extractedGPS.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {gpsError && (
                <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{gpsError}</p>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRetake}
                className="w-full"
              >
                Retomar foto
              </Button>
            </div>
          </Card>

          {/* Datos de la huerta */}
          <Card>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nombre de la Huerta
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Huerta Los Mangos"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
          </Card>

          <Card>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Propietario
            </label>
            <input
              type="text"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Nombre completo del propietario"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleRetake}
            >
              Atrás
            </Button>
            <Button type="submit" className="flex-1" disabled={!extractedGPS}>
              <Leaf className="w-5 h-5 mr-2" /> Registrar Huerta
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
