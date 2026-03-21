import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  Thermometer,
  MapPin,
  Grape,
  CheckCircle,
} from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Spinner } from "../common/Spinner";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { mintToBlockchain } from "../../utils/blockchain";

export default function QRScanner() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { addToast } = useToast();
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const [scannedLote, setScannedLote] = useState(null);
  const [manualId, setManualId] = useState("");
  const [scannerActive, setScannerActive] = useState(true);
  const [form, setForm] = useState({
    brix: "",
    destination: "",
    temperature: "",
  });
  const [confirming, setConfirming] = useState(false);

  // Keep a stable ref to the latest lotes list so the QR callback doesn't go stale
  const lotesRef = useRef(state.lotes);
  lotesRef.current = state.lotes;

  useEffect(() => {
    if (!scannerActive) return;

    let scanner = null;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("qr-reader");
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Use ref to always have fresh lotes list
            setScannerActive(false);
            let found = null;
            try {
              const parsed = JSON.parse(decodedText);
              found = lotesRef.current.find((l) => l.id === parsed.loteId);
            } catch {
              found = lotesRef.current.find((l) => l.id === decodedText);
            }
            if (found) {
              setScannedLote(found);
              addToast("Lote encontrado: " + found.id, "success");
            } else {
              addToast("Lote no encontrado en el sistema", "error");
              setScannerActive(true);
            }
            scanner.stop().catch(() => {});
          },
          () => {},
        );
      } catch {
        // Camera not available — use manual input below
      }
    };

    initScanner();

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, [scannerActive, addToast]);

  const handleScan = (data) => {
    setScannerActive(false);
    let found = null;
    try {
      const parsed = JSON.parse(data);
      found = state.lotes.find((l) => l.id === parsed.loteId);
    } catch {
      found = state.lotes.find((l) => l.id === data);
    }
    if (found) {
      setScannedLote(found);
      addToast("Lote encontrado: " + found.id, "success");
    } else {
      addToast("QR inválido o lote no encontrado", "error");
      setScannerActive(true);
    }
  };

  const handleManualSearch = () => {
    const lote = state.lotes.find((l) => l.id === manualId.trim());
    if (lote) {
      setScannedLote(lote);
      setScannerActive(false);
      addToast("Lote encontrado", "success");
    } else {
      addToast("No se encontró un lote con ese ID", "error");
    }
  };

  const handleConfirm = async () => {
    if (!form.brix || !form.destination || !form.temperature) {
      addToast("Completa todos los campos de calidad", "error");
      return;
    }

    setConfirming(true);
    try {
      const result = await mintToBlockchain({
        type: "reception",
        loteId: scannedLote.id,
        brix: parseFloat(form.brix),
        destination: form.destination,
        temperature: parseFloat(form.temperature),
      });

      dispatch({
        type: "CONFIRM_RECEPTION",
        payload: {
          loteId: scannedLote.id,
          reception: {
            brix: parseFloat(form.brix),
            destination: form.destination,
            temperature: parseFloat(form.temperature),
            txHash: result.txHash,
            timestamp: result.timestamp,
          },
        },
      });

      addToast("¡Recepción confirmada en blockchain!", "success");
      navigate("/app/dashboard");
    } catch {
      addToast("Error al confirmar recepción", "error");
    } finally {
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner text="Confirmando recepción en blockchain..." />
      </div>
    );
  }

  // Show quality form if lote scanned
  if (scannedLote) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Lote Detectado
          </h1>
          <p className="text-sm text-slate-500 font-mono">{scannedLote.id}</p>
        </div>

        <Card className="mb-5">
          <div className="flex gap-3">
            {scannedLote.photoUrl ? (
              <img
                src={scannedLote.photoUrl}
                alt="Lote"
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : null}
            <div className="text-sm space-y-1">
              <p>
                <strong>Peso:</strong> {scannedLote.weight} kg
              </p>
              <p>
                <strong>Cosechado:</strong>{" "}
                {new Date(scannedLote.timestamp).toLocaleDateString("es-MX")}
              </p>
              <p>
                <strong>Estado:</strong> {scannedLote.status}
              </p>
            </div>
          </div>
        </Card>

        <h3 className="font-bold text-slate-900 mb-3">Datos de Calidad</h3>

        <div className="space-y-4">
          <Card>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Grape className="w-4 h-4 inline mr-1" />
              Grados Brix / Madurez
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.brix}
              onChange={(e) => setForm({ ...form, brix: e.target.value })}
              placeholder="Ej: 12.5"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
          </Card>

          <Card>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Destino
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
              placeholder="Ej: Central de Abastos CDMX"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
          </Card>

          <Card>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Thermometer className="w-4 h-4 inline mr-1" />
              Temperatura (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.temperature}
              onChange={(e) =>
                setForm({ ...form, temperature: e.target.value })
              }
              placeholder="Ej: 4.5"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
            />
          </Card>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-6" size="lg">
          <CheckCircle className="w-5 h-5 mr-2" /> Confirmar Recepción
        </Button>
      </div>
    );
  }

  // Scanner view
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Recepción de Lote
        </h1>
        <p className="text-slate-500 text-sm">Escanea el código QR del lote</p>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full min-h-75 rounded-xl overflow-hidden"
        />
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-400">
          <ScanLine className="w-4 h-4" />
          <span>Apunta la cámara al código QR</span>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-slate-700 mb-3">
          ¿Sin cámara? Ingresa el ID del lote:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="LOTE-XXXXX-XXXX"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
          />
          <Button onClick={handleManualSearch} size="sm">
            Buscar
          </Button>
        </div>
        {state.lotes.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-2">Lotes disponibles:</p>
            {state.lotes.map((l) => (
              <button
                key={l.id}
                onClick={() => handleScan(l.qrData || l.id)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 font-mono cursor-pointer"
              >
                {l.id} — {l.status}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
