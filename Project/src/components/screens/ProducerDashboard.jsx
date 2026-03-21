import { Link, useNavigate } from "react-router-dom";
import { Plus, Camera, Package, Clock } from "lucide-react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { useApp } from "../../context/AppContext";

export default function ProducerDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { orchard, lotes } = state;

  const activeLotes = lotes.filter((l) => l.status !== "Entregado").length;

  return (
    <div className="max-w-lg mx-auto">
      {/* Orchard info */}
      {orchard && (
        <Card className="mb-6 bg-linear-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-4">
            {orchard.photoUrl ? (
              <img
                src={orchard.photoUrl}
                alt="Huerta"
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-slate-900">{orchard.name}</h2>
              <p className="text-sm text-slate-500">{orchard.owner}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-3xl font-extrabold text-primary">{lotes.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Lotes</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-extrabold text-accent">{activeLotes}</p>
          <p className="text-sm text-slate-500 mt-1">Activos</p>
        </Card>
      </div>

      {/* Lotes list */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Mis Lotes</h3>
        <Link
          to="/app/qr-scanner"
          className="text-sm text-primary font-semibold hover:underline"
        >
          Recepción QR →
        </Link>
      </div>

      {lotes.length === 0 ? (
        <Card className="text-center py-10">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">
            No tienes lotes registrados
          </p>
          <p className="text-slate-300 text-xs">
            Presiona el botón + para crear tu primera cosecha
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...lotes].reverse().map((lote) => (
            <Card
              key={lote.id}
              onClick={() => navigate(`/app/traceability/${lote.id}`)}
              className="hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  {lote.photoUrl ? (
                    <img
                      src={lote.photoUrl}
                      alt="Lote"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {lote.id}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(lote.timestamp).toLocaleDateString("es-MX")}
                    </div>
                    {lote.weight && (
                      <p className="text-xs text-slate-500 mt-1">
                        {lote.weight} kg
                      </p>
                    )}
                  </div>
                </div>
                <Badge status={lote.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        to="/app/capture-batch"
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30"
      >
        <Camera className="w-7 h-7" />
      </Link>
    </div>
  );
}
