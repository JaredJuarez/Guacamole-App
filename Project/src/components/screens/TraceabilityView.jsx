import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Camera,
  Truck,
  ShieldCheck,
  Hash,
  Weight,
  Thermometer,
  Grape,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Timeline } from "../common/Timeline";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { useApp } from "../../context/AppContext";

// Demo data for when accessed with "demo" id
const demoLote = {
  id: "LOTE-DEMO-001",
  photoUrl: null,
  lat: 20.6597,
  lng: -103.3496,
  weight: 350,
  txHash: "a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
  photoHash: "f4e5d6c7b8a90123456789abcdef0123456789abcdef0123456789abcdef0123",
  timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  status: "Entregado",
  reception: {
    brix: 14.2,
    destination: "Central de Abastos, Guadalajara",
    temperature: 4.5,
    txHash: "b2c3d4e5f6a789012345678abcdef0123456789abcdef0123456789abcdef02",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
};

const demoOrchard = {
  name: "Huerta Los Mangos",
  owner: "Juan Pérez",
  lat: 20.6597,
  lng: -103.3496,
  txHash: "c3d4e5f6a7b89012345678abcdef0123456789abcdef0123456789abcdef03",
  timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
};

export default function TraceabilityView() {
  const { loteId } = useParams();
  const { state } = useApp();

  const isDemo = loteId === "demo";
  const lote = isDemo ? demoLote : state.lotes.find((l) => l.id === loteId);
  const orchard = isDemo ? demoOrchard : state.orchard;

  if (!lote) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Hash className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Lote no encontrado
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          El lote solicitado no existe en el sistema.
        </p>
        <Link to="/app/dashboard">
          <Button variant="outline">Ir al Dashboard</Button>
        </Link>
      </div>
    );
  }

  const nodes = [
    {
      title: "Origen — Huerta",
      timestamp: orchard?.timestamp,
      verified: true,
      content: (
        <div className="space-y-3">
          {orchard?.photoUrl && (
            <img
              src={orchard.photoUrl}
              alt="Huerta"
              className="w-full h-40 object-cover rounded-xl"
            />
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Huerta</p>
              <p className="font-semibold text-slate-700">
                {orchard?.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Propietario</p>
              <p className="font-semibold text-slate-700">
                {orchard?.owner || "N/A"}
              </p>
            </div>
          </div>
          {orchard?.lat && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
              <MapPin className="w-3 h-3" />
              {orchard.lat.toFixed(4)}, {orchard.lng.toFixed(4)}
            </div>
          )}
          {orchard?.txHash && (
            <p className="text-xs text-slate-400 font-mono break-all">
              TX: {orchard.txHash.substring(0, 20)}...
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Cosecha — Lote",
      timestamp: lote.timestamp,
      verified: true,
      content: (
        <div className="space-y-3">
          {lote.photoUrl && (
            <img
              src={lote.photoUrl}
              alt="Lote"
              className="w-full h-40 object-cover rounded-xl"
            />
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Weight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400 text-xs">Peso:</span>
              <span className="font-semibold text-slate-700">
                {lote.weight} kg
              </span>
            </div>
            <div>
              <Badge status={lote.status} />
            </div>
          </div>
          {lote.lat && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
              <MapPin className="w-3 h-3" />
              {lote.lat.toFixed(4)}, {lote.lng.toFixed(4)}
            </div>
          )}
          {lote.photoHash && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
              <Hash className="w-3 h-3" />
              <span className="font-mono break-all">
                {lote.photoHash.substring(0, 32)}...
              </span>
            </div>
          )}
          <p className="text-xs text-slate-400 font-mono break-all">
            TX: {lote.txHash.substring(0, 20)}...
          </p>
        </div>
      ),
    },
  ];

  // Add reception node if available
  if (lote.reception) {
    nodes.push({
      title: "Logística — Recepción",
      timestamp: lote.reception.timestamp,
      verified: true,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Grape className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400 text-xs">Brix:</span>
              <span className="font-semibold text-slate-700">
                {lote.reception.brix}°
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400 text-xs">Temp:</span>
              <span className="font-semibold text-slate-700">
                {lote.reception.temperature}°C
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Destino:</span>
            <span className="font-semibold text-slate-700">
              {lote.reception.destination}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono break-all">
            TX: {lote.reception.txHash.substring(0, 20)}...
          </p>
        </div>
      ),
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-green-50 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
          <ShieldCheck className="w-4 h-4" />
          Verificado en Blockchain
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Trazabilidad del Lote
        </h1>
        <p className="text-sm text-slate-500 font-mono">{lote.id}</p>
      </div>

      {/* Timeline */}
      <Timeline nodes={nodes} />

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    </div>
  );
}
