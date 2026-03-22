import { createContext, useContext, useReducer, useEffect } from "react";

const AppContext = createContext(null);

const STORAGE_KEY = "guacamole-state";

const initialState = {
  user: null, // { name, role, orchardId }
  orchard: null, // { id, name, owner, lat, lng, photoUrl, txHash, timestamp }
  lotes: [], // [{ id, orchardId, photoUrl, lat, lng, weight, txHash, timestamp, status, qrData, reception }]
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  } catch {
    return initialState;
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case "REGISTER_ORCHARD":
      return {
        ...state,
        orchard: action.payload,
        user: {
          name: action.payload.owner,
          role: "producer",
          orchardId: action.payload.id,
        },
      };
    case "ADD_LOTE":
      return { ...state, lotes: [...state.lotes, action.payload] };
    case "UPDATE_LOTE_STATUS":
      return {
        ...state,
        lotes: state.lotes.map((l) =>
          l.id === action.payload.id
            ? { ...l, status: action.payload.status }
            : l,
        ),
      };
    case "CONFIRM_RECEPTION":
      return {
        ...state,
        lotes: state.lotes.map((l) =>
          l.id === action.payload.loteId
            ? { ...l, status: "Entregado", reception: action.payload.reception }
            : l,
        ),
      };
    case "CLEAR_SESSION":
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
