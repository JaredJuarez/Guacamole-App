# 🥑 Proyecto Guacamole — Plan de Desarrollo
Sistema de trazabilidad híbrido (Off-chain + On-chain) usando Soroban (Stellar), Node.js y MySQL.

---

# 🎯 Objetivo
Construir un sistema SaaS de trazabilidad agrícola donde:
- Cada lote = 1 contrato inteligente
- Cada evento = firma on-chain
- Backend gestiona lógica y datos pesados
- Blockchain garantiza inmutabilidad

---

# 🧱 Arquitectura General

## On-chain (Soroban)
- Factory Contract → crea contratos de lote
- Batch Contract → maneja trazabilidad individual

## Off-chain
- Backend: Node.js (API + lógica)
- DB: MySQL (metadata + imágenes)
- Storage: S3 / Cloudinary (fotos)

---

# 🗺️ Roadmap General

| Fase | Nombre | Duración | Output |
|------|--------|--------|--------|
| 1 | Smart Contracts | 1-2 semanas | Contratos funcionales |
| 2 | Backend API | 2 semanas | API REST |
| 3 | DB & Storage | 1 semana | Modelo estable |
| 4 | Integración Blockchain | 1 semana | Endpoints conectados |
| 5 | Frontend / App | 2 semanas | UI funcional |
| 6 | Seguridad & QA | 1 semana | Sistema estable |
| 7 | Deploy | 1 semana | Producción |

---

# ⚙️ FASE 1 — Smart Contracts (Soroban)

## Objetivo
Implementar lógica on-chain con patrón Factory.

## Tareas

### 1. Batch Contract
- [ ] Definir estructura Checkpoint
- [ ] Implementar `init()`
- [ ] Implementar `add_checkpoint()`
- [ ] Implementar `get_history()`
- [ ] Implementar validaciones de roles
- [ ] Implementar require_auth()

### 2. Factory Contract
- [ ] Implementar `create_batch()`
- [ ] Guardar lista de contratos creados
- [ ] Control de acceso (solo backend)

### 3. Testing
- [ ] Tests unitarios en Rust
- [ ] Simulación de flujo completo

### 4. Deploy
- [ ] Compilar WASM
- [ ] Deploy en testnet
- [ ] Guardar contract IDs

📌 Nota:
Soroban usa Rust + WASM para eficiencia y escalabilidad :contentReference[oaicite:0]{index=0}

---

# ⚙️ FASE 2 — Backend (Node.js)

## Stack
- Node.js + Express
- MySQL
- Soroban SDK
- Multer (uploads)

## Estructura
