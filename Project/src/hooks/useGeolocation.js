import { useState } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState({ lat: null, lng: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestPosition = () => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada en este navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permiso de ubicación denegado. Habilítalo en la configuración del navegador."
            : "No se pudo obtener la ubicación. Intenta de nuevo.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return { position, error, loading, requestPosition };
}
