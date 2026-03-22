# Guacamole
<div align="center">
  <img src="./Project/src/assets/guacamole_logo.jpg" alt="Guacamole Logo" width="400" />
</div>

> **Blockchain-powered agricultural supply chain traceability** — From farm to table with complete transparency

[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2.2-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Stellar](https://img.shields.io/badge/Stellar-Blockchain-14F195)](https://stellar.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Descripción

**Guacamole** es una plataforma web de trazabilidad agrícola que utiliza blockchain (Stellar/Soroban) para garantizar transparencia total en la cadena de suministro. Cada producto se registra como un NFT verificable, permitiendo a productores, intermediarios y consumidores rastrear el viaje completo desde la huerta hasta la mesa.

### ¿Por qué Guacamole?

Guacamole está hecho de ingredientes naturales verificables, cada uno con su origen. Al igual que el guacamole, nuestro sistema verifica el origen de cada ingrediente (producto agrícola) a través de la cadena de suministro.

---

## Características Principales

### 3 Perfiles de Usuario

#### Productor — Origen Verificado

- Registra su huerta con foto + geolocalización GPS
- Crea lotes de cosecha con documentación fotográfica
- Genera NFTs únicos por cada lote (código QR incluido)
- Accede a dashboard con historial de cosechas
- **Flujo**: `Registrar Huerta` → `Dashboard` → `Capturar Cosecha`

#### Intermediario — Verificación en Tránsito

- Escanea códigos QR de lotes recibidos
- Registra métricas de calidad (Brix, temperatura, destino)
- Firma digitalmente la recepción en blockchain
- Crea auditoría inmutable de inspección
- **Flujo**: Escanear QR → Ingresar datos de calidad → Confirmar recepción

#### Consumidor — Transparencia Total

- Escanea QR en el producto para ver trazabilidad completa
- Visualiza timeline de **Origen** → **Cosecha** → **Entrega**
- Verifica autenticidad en blockchain
- Acceso público sin autenticación
- **Flujo**: `Escanear QR` → Ver timeline de trazabilidad

---

## Inicio Rápido

### Requisitos Previos

- Node.js 18+
- npm 9+
- Camera access (para captura de fotos y escaneo QR)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd Project

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor iniciará en `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/`

---

## Rutas de la Aplicación

| Ruta                        | Descripción                         | Acceso                 |
| --------------------------- | ----------------------------------- | ---------------------- |
| `/`                         | Landing page con propuesta de valor | Público                |
| `/trace/:loteId`            | Vista pública de trazabilidad       | Público (Consumer)     |
| `/app`                      | App autenticada (hub principal)     | Productores            |
| `/app/register-orchard`     | Registro inicial de huerta          | Productor (primer uso) |
| `/app/dashboard`            | Dashboard con lotes registrados     | Productor              |
| `/app/capture-batch`        | Crear nueva cosecha/lote            | Productor              |
| `/app/qr-scanner`           | Escanear QR de lotes                | Intermediario          |
| `/app/traceability/:loteId` | Historial completo de lote          | Productor/Demo         |

---

## Arquitectura

### Stack Tecnológico

```
Frontend:
├─ React 19.2 (UI Framework)
├─ React Router 7 (Navigation)
├─ Vite 8 (Build tool + HMR)
├─ Tailwind CSS 4.2 (Styling)
└─ Lucide React (Icons)

Features:
├─ QR Code Gen/Scan (qrcode.react, html5-qrcode)
├─ EXIF Extraction (piexifjs) → GPS from photos
├─ Geolocation (Browser API)
└─ Blockchain (Stellar - simulated in demo)

State:
├─ React Context (AppContext, ToastContext)
└─ localStorage persistence (guacamole-state)
```

### Estructura de Carpetas

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx          # Reusable button component
│   │   ├── Card.jsx            # Surface container
│   │   ├── Badge.jsx           # Status badges
│   │   ├── Modal.jsx           # Dialog windows
│   │   ├── CameraCapture.jsx   # Photo input with EXIF
│   │   ├── Timeline.jsx        # Batch journey visualization
│   │   ├── Spinner.jsx         # Loading indicator
│   │   ├── Toast.jsx           # Notifications
│   │   └── GuacamoleLogo.jsx   # Brand logo component
│   ├── landing/
│   │   └── LandingPage.jsx     # Public homepage
│   └── screens/
│       ├── RegisterOrchard.jsx   # Orchard signup (Step 1)
│       ├── ProducerDashboard.jsx # Producer hub
│       ├── CaptureBatch.jsx      # Create new batch NFT
│       ├── QRScanner.jsx         # Intermediary verification
│       └── TraceabilityView.jsx  # Public timeline view
├── context/
│   ├── AppContext.jsx          # Global state management
│   └── ToastContext.jsx        # Notification system
├── hooks/
│   └── useGeolocation.js       # Browser geolocation wrapper
├── utils/
│   ├── blockchain.js           # Stellar integration
│   └── exifExtractor.js        # GPS from photo metadata
├── pages/
│   └── AppLayout.jsx           # Main app wrapper
├── App.jsx                     # Router & routes
├── main.jsx                    # Entry point
└── index.css                   # Global styles

assets/
├── hero.jpg                    # Hero background
├── productor.jpg               # Profile image
├── intermediario.jpg           # Profile image
├── consumidor.jpg              # Profile image
├── favicon.svg                 # Guacamole icon
└── react.svg / vite.svg        # Build tool logos
```

### Flujo de Estado (AppContext)

```javascript
State {
  orchard: {
    id, name, owner, lat, lng,
    photoUrl, txHash, timestamp
  },
  lotes: [
    {
      id, orchardId, photoUrl, lat, lng, weight,
      status: "Cosechado" | "Entregado",
      txHash, photoHash, qrData,
      reception: { brix, temperature, destination, txHash } | null
    }
  ]
}

Actions:
- REGISTER_ORCHARD: initialOrchardData
- ADD_LOTE: newLoteData
- UPDATE_LOTE_STATUS: { loteId, status }
- CONFIRM_RECEPTION: { loteId, receptionData }
- CLEAR_SESSION: logout
```

---

## Funcionalidades Principales

### Registro de Huerta (Productor)

1. **Captura de Foto**
   - Acceso a cámara en tiempo real
   - Preservación automática de metadatos EXIF
   - Opción de retomar foto

2. **Geolocalización**
   - Intenta extraer GPS de EXIF (si cámara tiene GPS)
   - Fallback automático a Geolocation API del navegador
   - Funciona en HTTP localhost (sin HTTPS requerido)
   - Muestra coordenadas con 6 decimales de precisión

3. **Datos de Huerta**
   - Nombre de huerta
   - Nombre del propietario
   - NFT minting en blockchain (verificable)

### Captura de Cosecha (Productor)

1. **Documentación Fotográfica**
   - Captura de foto del lote
   - Extracción automática de GPS
   - Validación visual

2. **Peso & Generación de NFT**
   - Ingresa peso en kg (obligatorio > 0)
   - Genera ID único: `LOTE-[TIMESTAMP_BASE36]-[RANDOM]`
   - Crea hash SHA-256 de foto (verificación de integridad)
   - Minta en blockchain (returns txHash)

3. **Código QR**
   - QR generado automáticamente con datos del lote
   - Escaneable por intermediarios y consumidores
   - Datos embebidos: loteId, txHash

### Escaneo QR (Intermediario)

1. **Captura de QR**
   - Scanner HTML5 con auto-focus
   - Soporte para búsqueda manual por ID
   - Fallback para cámaras no compatibles

2. **Verificación de Calidad**
   - Brix score (medida de madurez/contenido de azúcar)
   - Temperatura registrada (°C)
   - Destino final (punto de venta)

3. **Firma Digital**
   - Registra reception en blockchain
   - Marca lote como "Entregado"
   - Genera txHash de verificación

### Timeline de Trazabilidad (Consumidor)

**Visualización de 3 etapas:**

| Etapa   | Datos Mostrados                       | Verificación      |
| ------- | ------------------------------------- | ----------------- |
| Origen  | Foto huerta, nombre, propietario, GPS | txHash blockchain |
| Cosecha | Foto lote, peso, GPS, ID, status      | Hash de foto      |
| Entrega | Brix, temperatura, destino, fecha     | txHash recepción  |

Acceso público sin autenticación. Demo: `/trace/demo`

---

## Diseño & UX

### Paleta de Colores

```
Primary:        #16a34a (Green - Growth/Nature)
Primary Dark:   #15803d (Hover states)
Accent:         #ca8a04 (Gold - Premium)
Background:     #f8fafc (Light slate)
Surface:        #ffffff (White cards)
```

### Componentes Reutilizables

- **Button**: 5 variants (primary, secondary, outline, danger, ghost) × 3 sizes (sm, md, lg)
- **Card**: Flexible surface con opcional onClick
- **Badge**: Status badges color-coded (Cosechado, Entregado, etc.)
- **Modal**: Dialog reusable con backdrop
- **Timeline**: Visualización vertical con nodos verificados
- **Spinner**: Loading con texto opcional
- **Toast**: Sistema de notificaciones auto-desestable

---

## Integración Blockchain (Stellar)

### Contractos/Funciones (Demo)

```javascript
// utils/blockchain.js

mintToBlockchain(data)
  → Inputs: { type, name, owner, lat, lng, ... }
  → Returns: { txHash, timestamp, data }
  → Simula 2s de transacción en demo

generateHash(input)
  → SHA-256 digest
  → Usado para verificación de integridad de fotos

generateLoteId()
  → Crea ID único: LOTE-[TIMESTAMP_BASE36]-[RANDOM_4]
  → Garantiza unicidad + legibilidad
```

**Estado Actual**: Mock/simulated para demostración. Ready para integración real con Stellar SDK.

---

## Persistencia de Datos

- **Método**: localStorage con clave `guacamole-state`
- **Contenido**: Orchard + todos los lotes (estado completo)
- **Auto-sync**: Actualiza automáticamente en cada cambio
- **Duración**: Persiste entre sesiones del navegador
- **Reset**: Function `CLEAR_SESSION` vacía todo

---

## Casos de Uso

### **Producer Flow** (Productor)

```
1. Landing → Click "Probar Demo" → Modal de perfiles
2. Select "Productor" → /app/register-orchard
3. Capturar foto + permitir GPS → Llena forma → Register
4. Navega a Dashboard → Ve orchard + vacío (sin lotes)
5. Click en + FAB → /app/capture-batch
6. Captura foto → Ingresa peso → Generate NFT
7. Ve modal con QR → Vuelve a dashboard
8. Nuevo lote aparece con timestamp
```

### **Intermediary Flow** (Intermediario)

```
1. Landing → Click "Probar Demo" → Select "Intermediario"
2. Navigate a /app/qr-scanner
3. Scan QR or Search by ID
4. Fill quality form: Brix, Temperature, Destination
5. Confirm Recepción → Blockchain
```

### **Consumer Flow** (Consumidor)

```
1. Landing → Click "Probar Demo" → Select "Consumidor"
2. Navigate a /trace/demo
3. Timeline muestra 3 etapas
4. Verifica TX hashes en blockchain
```

---

## Dependencias Clave

| Package            | Versión | Uso           |
| ------------------ | ------- | ------------- |
| `react`            | 19.2.4  | UI framework  |
| `react-router-dom` | 7.x     | Routing       |
| `vite`             | 8.0     | Build tool    |
| `tailwindcss`      | 4.2.2   | Styling       |
| `qrcode.react`     | ^1.0    | QR generation |
| `html5-qrcode`     | ^2.3    | QR scanning   |
| `piexifjs`         | ^0.1    | EXIF metadata |
| `lucide-react`     | ^0.x    | Icons         |

---

## Inicio Rápido Completo

```bash
# 1. Instalación
npm install

# 2. Desarrollo
npm run dev              # http://localhost:5173

# 3. Testing
- Landing page: /
- Producer demo: Click "Probar Demo" → "Productor"
- Intermediary: Select "Intermediario"
- Consumer: Select "Consumidor"

# 4. Build
npm run build

# 5. Preview
npm run preview
```

---

## Licencia

MIT © 2026 Mx Alebrijes

---

## Contacto & Soporte

- **Propuesta Valor**: Blockchain para trazabilidad agrícola 100% transparente
- **Powered by**: Stellar & Soroban
- **Built with**: React + Vite + Tailwind CSS

---

<div align="center">

### Guacamole — Trazabilidad Agrícola Verificable

**De la huerta a tu mesa, con tranquilidad.**

</div>
