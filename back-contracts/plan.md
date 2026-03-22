# Plan Base de Desarrollo: Backend Completo + Smart Contracts para Guacamole

## Resumen
Construir `Guacamole` como plataforma híbrida de trazabilidad agrícola sobre Stellar con este enfoque base:
- `Soroban` en `Rust` para garantizar inmutabilidad de hitos críticos por lote.
- `Backend` en `Node.js` como capa orquestadora de negocio, seguridad, persistencia y conexión a Stellar.
- `MySQL` para metadata pesada, actores, permisos, evidencias y auditoría operativa.
- `Storage` externo (`S3` o `Cloudinary`) para fotos y archivos, guardando en cadena solo hashes y datos mínimos verificables.
- Primer release diseñado para `Testnet -> Mainnet`, con modelo de firma `backend custodio` y QR público de `resumen + validación`.

## Cambios de implementación
### 1. Arquitectura funcional
- Mantener separación estricta `off-chain/on-chain`.
- Usar `1 Factory Contract` para desplegar contratos de lote y `1 Batch Contract` por lote.
- Tratar Soroban como registro notarial de eventos críticos, no como base de datos general.
- Guardar en cadena solo: `batch_id`, `wallets públicas`, `photo_hash`, `timestamp`, `geo_hash o coordenada resumida`, `rol del firmante`, `tx_hash`, `estado del lote`.
- Guardar fuera de cadena: nombres, RFC, contacto, variedad, peso, notas, URLs de evidencia, auditoría interna, permisos operativos.

### 2. Contratos inteligentes
- `FactoryContract`
  - Exponer `create_batch(batch_id, producer, initial_photo_hash, initial_checkpoint_data_ref)`
  - Crear y registrar el contrato hijo por lote.
  - Guardar índice `batch_id -> contract_address`.
  - Restringir creación al `backend service signer`.
- `BatchContract`
  - Constructor o `init` de una sola ejecución.
  - Estructuras base: `BatchState`, `Checkpoint`, `Role`, `BatchStatus`.
  - Exponer al menos:
    - `add_checkpoint(actor, role, photo_hash, timestamp, location_hash, status, db_ref)`
    - `get_summary()`
    - `get_history()`
    - `close_batch(final_status)`
  - Validar secuencia de custodia permitida: `producer -> transporter -> inspector -> distributor`.
  - Exigir `require_auth` del firmante custodio del backend en v1.
  - Emitir eventos por `BatchCreated`, `CheckpointAdded`, `BatchClosed`.
  - Usar `persistent storage` para historial y `instance storage` para configuración/estado global.
- Política de diseño:
  - Contratos inmutables en v1; no planificar upgrades hasta tener necesidad real.
  - No usar tokenización ni SAC en v1 porque el caso de uso actual es trazabilidad documental, no activos transferibles.

### 3. Backend completo
- Stack base:
  - `Node.js + TypeScript`
  - `Express` o `Fastify`
  - `MySQL`
  - `@stellar/stellar-sdk`
  - cliente RPC de Stellar
  - `Multer` para uploads
- Módulos backend:
  - `auth`: login, roles, sesiones/JWT y control de acceso.
  - `users`: productores, transportistas, inspectores, distribuidores, admins.
  - `wallets`: asociación de wallet pública por actor y wallet custodial operativa del backend.
  - `batches`: creación, consulta, transición de estados.
  - `checkpoints`: alta de eventos con evidencia.
  - `media`: subida de fotos, cálculo SHA-256, persistencia de URL.
  - `stellar`: simulación, firma, envío, polling de transacciones, lectura de eventos/ledger.
  - `verification`: endpoint público para QR y reconciliación DB vs blockchain.
  - `audit`: bitácora interna de acciones, errores y transacciones.
- Flujo de creación:
  - Crear lote en DB.
  - Subir evidencia inicial.
  - Generar `sha256`.
  - Crear batch en Soroban.
  - Persistir `contract_id`, `tx_hash`, `status`.
- Flujo de checkpoint:
  - Validar rol y transición permitida.
  - Guardar evidencia.
  - Generar hash.
  - Invocar `add_checkpoint`.
  - Confirmar resultado y reconciliar en DB.
- Consulta pública QR:
  - Resolver `batch_id`.
  - Leer metadata pública de DB.
  - Leer resumen/historial on-chain.
  - Verificar coincidencia de hashes.
  - Responder con sello `autenticado`, `inconsistente` o `pendiente de verificación`.

### 4. Modelo de datos e interfaces
- Tablas mínimas:
  - `users`
  - `organizations`
  - `roles`
  - `wallets`
  - `batches`
  - `batch_checkpoints`
  - `media_assets`
  - `blockchain_transactions`
  - `audit_logs`
- Campos clave:
  - `batches`: `id`, `uuid`, `contract_id`, `producer_id`, `status`, `current_role`, `created_at`
  - `batch_checkpoints`: `id`, `batch_id`, `role`, `actor_id`, `photo_hash`, `location_hash`, `tx_hash`, `checkpoint_order`, `timestamp_onchain`
  - `media_assets`: `id`, `batch_id`, `checkpoint_id`, `storage_url`, `sha256`, `mime_type`
- API pública/privada base:
  - `POST /auth/login`
  - `POST /users`
  - `POST /batches`
  - `GET /batches/:id`
  - `POST /batches/:id/checkpoints`
  - `GET /batches/:id/history`
  - `GET /verify/:batchId`
  - `GET /health`
- Configuración de red:
  - v1 en `Stellar Testnet RPC`.
  - backend con servicio de firma custodial y rotación futura de claves.
  - dejar preparado `network config` por entorno: `local`, `testnet`, `mainnet`.

## Plan de pruebas
- Smart contracts:
  - creación de lote correcta
  - rechazo de doble inicialización
  - checkpoint válido por secuencia correcta
  - rechazo por rol/transición inválida
  - cierre de lote y bloqueo de nuevos eventos
  - emisión de eventos on-chain
- Backend:
  - creación de lote con foto y hash
  - persistencia correcta de `contract_id` y `tx_hash`
  - reconciliación entre DB y chain
  - endpoint público `verify` con caso válido e inconsistente
  - control de acceso por rol
  - reintentos y manejo de fallos RPC
- Integración:
  - tests unitarios de contratos con `soroban-sdk`
  - tests de integración backend + RPC en red local o testnet
  - pruebas de subida de archivos y hash
  - pruebas de polling de transacción y confirmación final
- Criterios de aceptación:
  - un lote puede crearse end-to-end
  - cada cambio de custodia genera checkpoint on-chain y registro off-chain
  - el QR público confirma autenticidad comparando hashes
  - el historial del lote puede reconstruirse sin pérdida entre DB y cadena

## Supuestos y decisiones fijadas
- Los requisitos válidos salen de `[Informacion-del-sistema.md](/c:/Users/Alex/Desktop/Nueva%20carpeta/Backend/Informacion-del-sistema.md)` y `[negocio.md](/c:/Users/Alex/Desktop/Nueva%20carpeta/Backend/negocio.md)`.
- v1 usará `backend custodio`, no firma directa de cada actor.
- v1 mostrará al consumidor solo `resumen + validación`, no todo el detalle interno.
- No se incluye todavía KYC regulatorio formal ni tokenización de activos.
- No se incluye frontend en este plan salvo las interfaces que condicionan el backend.
- Se asume que el `batch_id` de negocio será `UUID` y además ancla de unión entre DB y blockchain.
- Se asume que la ubicación on-chain será una forma resumida o hasheada para no exponer más datos de los necesarios.
- Se recomienda arrancar con monorepo de dos paquetes: `contracts/` y `backend/`, más un módulo compartido de tipos/eventos para evitar divergencias semánticas.


GDOCB74SY2ROHJ3BDG3CRGVVSSJSVMUAZHB7MMD7EH56TYW6FQCWRQSG