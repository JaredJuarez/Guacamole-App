# Documentacion de Endpoints del Backend

Esta guia resume los endpoints expuestos por el backend en `backend/src/app.ts` y explica como probarlos correctamente.

## Base URL y arranque

- Puerto por defecto: `3000`
- Base URL local: `http://localhost:3000`
- Comando de desarrollo:

```bash
npm run dev -w backend
```

## Requisitos previos

Antes de probar la API, confirma que:

- MySQL esta levantado y accesible con las credenciales de `backend/.env`
- Las tablas del esquema de `backend/db/schema.sql` ya existen
- El backend arranca sin errores de variables de entorno
- Si quieres usar la parte on-chain real, `STELLAR_SECRET_KEY` y `STELLAR_FACTORY_CONTRACT_ID` deben estar configurados

Notas:

- El token JWT expira en `12h`
- El backend usa `express.json()` para JSON y `multer` para `multipart/form-data` en endpoints con imagen
- Las fotos no se suben realmente a un storage externo por ahora: se calcula el hash SHA-256 y se genera una URL publica simulada con `PUBLIC_STORAGE_BASE_URL`

## Variables de entorno relevantes

- `PORT`: puerto del servidor
- `JWT_SECRET`: secreto para firmar y validar JWT
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`: conexion a base de datos
- `STELLAR_RPC_URL`, `STELLAR_NETWORK_PASSPHRASE`, `STELLAR_SECRET_KEY`, `STELLAR_FACTORY_CONTRACT_ID`: integracion con Stellar
- `PUBLIC_STORAGE_BASE_URL`: base para construir la URL de la foto

## Roles del sistema

Roles permitidos para usuarios:

- `admin`
- `producer`
- `transporter`
- `inspector`
- `distributor`

Secuencia valida de custodia del lote:

1. `producer`
2. `transporter`
3. `inspector`
4. `distributor`

Estados asociados a cada rol:

- `producer` -> `harvested`
- `transporter` -> `in_transit`
- `inspector` -> `inspected`
- `distributor` -> `delivered`

## Autenticacion

Los endpoints protegidos esperan:

```http
Authorization: Bearer <accessToken>
```

Si falta el header o el token no es valido, el backend responde con `401`.

## Endpoints

### `GET /health`

Sirve para comprobar que el backend esta vivo.

Respuesta esperada:

```json
{
  "ok": true,
  "service": "guacamole-backend"
}
```

Ejemplo:

```bash
curl http://localhost:3000/health
```

---

### `POST /auth/login`

Autentica un usuario existente.

Auth requerida:

- No

Content-Type:

- `application/json`

Body:

```json
{
  "email": "producer@example.com",
  "password": "Password123"
}
```

Validaciones:

- `email` debe tener formato valido
- `password` minimo 8 caracteres

Respuesta exitosa:

```json
{
  "user": {
    "id": 1,
    "organizationId": null,
    "email": "producer@example.com",
    "passwordHash": "$2b$10$...",
    "fullName": "Producer One",
    "role": "producer",
    "walletPublicKey": "GBRPYHIL2C...",
    "createdAt": "2026-03-22T00:00:00.000Z"
  },
  "accessToken": "eyJ..."
}
```

Errores comunes:

- `400` si el body no cumple el schema
- `401` si email o password no coinciden

Ejemplo:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"producer@example.com\",\"password\":\"Password123\"}"
```

---

### `POST /users`

Crea un usuario y devuelve su JWT inmediatamente.

Auth requerida:

- No

Content-Type:

- `application/json`

Body:

```json
{
  "organizationId": null,
  "email": "producer@example.com",
  "password": "Password123",
  "fullName": "Producer One",
  "role": "producer",
  "walletPublicKey": "GBRPYHIL2CI3JY..."
}
```

Validaciones:

- `organizationId`: numero o `null`
- `email`: email valido
- `password`: minimo 8 caracteres
- `fullName`: obligatorio
- `role`: uno de `admin | producer | transporter | inspector | distributor`
- `walletPublicKey`: minimo 8 caracteres

Respuesta exitosa:

- `201 Created`
- Mismo formato que login: `{ user, accessToken }`

Errores comunes:

- `400` por validacion
- `500` si el email ya existe u ocurre un error SQL

Ejemplo:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":null,\"email\":\"producer@example.com\",\"password\":\"Password123\",\"fullName\":\"Producer One\",\"role\":\"producer\",\"walletPublicKey\":\"GBRPYHIL2CI3JYEXAMPLE\"}"
```

---

### `POST /batches`

Crea un lote nuevo, registra el primer checkpoint del productor y dispara el alta on-chain o el fallback local si falta configuracion Stellar.

Auth requerida:

- Si

Roles permitidos:

- `admin`
- `producer`

Content-Type:

- `multipart/form-data`

Campos del formulario:

- `photo`: archivo obligatorio
- `producerId`: entero positivo
- `productName`: texto obligatorio
- `variety`: texto opcional
- `weightKg`: numero positivo opcional
- `notes`: texto opcional
- `locationHash`: string hexadecimal de 64 caracteres obligatorio

Ejemplo de `locationHash`:

```text
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

Respuesta exitosa:

- `201 Created`

Estructura de respuesta:

```json
{
  "id": 1,
  "uuid": "8f4f8e35-8db4-45e1-b5c8-0a25f1ce7d1a",
  "contractId": "CA...",
  "producerId": 1,
  "status": "harvested",
  "currentRole": "producer",
  "productName": "Guacamole Hass",
  "variety": "Hass",
  "weightKg": 120.5,
  "notes": "Lote inicial",
  "createdAt": "2026-03-22T00:00:00.000Z",
  "updatedAt": "2026-03-22T00:00:00.000Z",
  "checkpoint": {
    "id": 1,
    "batchId": 1,
    "actorId": 1,
    "role": "producer",
    "status": "harvested",
    "locationHash": "012345...",
    "photoHash": "ab12cd...",
    "txHash": "ef34...",
    "dbRef": "https://storage.example.com/....jpg",
    "checkpointOrder": 0,
    "timestampOnchain": "2026-03-22T00:00:00.000Z",
    "createdAt": "2026-03-22T00:00:00.000Z"
  }
}
```

Errores comunes:

- `400` si falta `photo`
- `400` si `locationHash` no tiene 64 caracteres
- `401` si falta token
- `403` si el rol del token no es `admin` o `producer`
- `500` si `producerId` no existe
- `502` o `504` si falla la integracion Stellar

Ejemplo con `curl`:

```bash
curl -X POST http://localhost:3000/batches \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "photo=@C:/ruta/imagen.jpg" \
  -F "producerId=1" \
  -F "productName=Guacamole Hass" \
  -F "variety=Hass" \
  -F "weightKg=120.5" \
  -F "notes=Lote inicial" \
  -F "locationHash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

Notas importantes:

- El backend no comprueba que `producerId` coincida con el usuario autenticado
- El archivo se usa para calcular `photoHash`, pero no se persiste fisicamente en este servicio
- El checkpoint inicial siempre queda con orden `0`

---

### `GET /batches/:id`

Obtiene el lote y todos sus checkpoints.

Auth requerida:

- Si

Roles permitidos:

- Cualquier usuario autenticado

Parametros:

- `id`: ID numerico del lote en la base de datos

Respuesta exitosa:

```json
{
  "id": 1,
  "uuid": "8f4f8e35-8db4-45e1-b5c8-0a25f1ce7d1a",
  "contractId": "CA...",
  "producerId": 1,
  "status": "in_transit",
  "currentRole": "transporter",
  "productName": "Guacamole Hass",
  "variety": "Hass",
  "weightKg": 120.5,
  "notes": "Lote inicial",
  "createdAt": "2026-03-22T00:00:00.000Z",
  "updatedAt": "2026-03-22T00:10:00.000Z",
  "checkpoints": [
    {
      "id": 1,
      "batchId": 1,
      "actorId": 1,
      "role": "producer",
      "status": "harvested",
      "locationHash": "012345...",
      "photoHash": "ab12...",
      "txHash": "cd34...",
      "dbRef": "https://storage.example.com/1.jpg",
      "checkpointOrder": 0,
      "timestampOnchain": "2026-03-22T00:00:00.000Z",
      "createdAt": "2026-03-22T00:00:00.000Z"
    }
  ]
}
```

Errores comunes:

- `401` si falta token
- `500` si el lote no existe, porque actualmente el repositorio lanza `Error` y no `HttpError`

Ejemplo:

```bash
curl http://localhost:3000/batches/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### `GET /batches/:id/history`

Devuelve solo la lista de checkpoints del lote.

Auth requerida:

- Si

Roles permitidos:

- Cualquier usuario autenticado

Parametros:

- `id`: ID numerico del lote

Respuesta exitosa:

```json
[
  {
    "id": 1,
    "batchId": 1,
    "actorId": 1,
    "role": "producer",
    "status": "harvested",
    "locationHash": "012345...",
    "photoHash": "ab12...",
    "txHash": "cd34...",
    "dbRef": "https://storage.example.com/1.jpg",
    "checkpointOrder": 0,
    "timestampOnchain": "2026-03-22T00:00:00.000Z",
    "createdAt": "2026-03-22T00:00:00.000Z"
  }
]
```

Errores comunes:

- `401` si falta token

Ejemplo:

```bash
curl http://localhost:3000/batches/1/history \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### `POST /batches/:id/checkpoints`

Agrega un nuevo checkpoint y actualiza el estado del lote.

Auth requerida:

- Si

Roles permitidos por endpoint:

- `admin`
- `transporter`
- `inspector`
- `distributor`

Content-Type:

- `multipart/form-data`

Campos del formulario:

- `photo`: archivo obligatorio
- `actorId`: entero positivo
- `role`: `producer | transporter | inspector | distributor`
- `locationHash`: string de 64 caracteres

Reglas de negocio reales:

- El lote no puede estar en estado `closed`
- La transicion de rol debe ser estricta:
  - si `currentRole` es `producer`, el siguiente debe ser `transporter`
  - si `currentRole` es `transporter`, el siguiente debe ser `inspector`
  - si `currentRole` es `inspector`, el siguiente debe ser `distributor`
- Aunque el schema acepta `producer`, en la practica ese valor fallara para un lote recien creado porque la transicion valida exige avanzar al siguiente rol

Respuesta exitosa:

- `201 Created`

Ejemplo de respuesta:

```json
{
  "id": 2,
  "batchId": 1,
  "actorId": 2,
  "role": "transporter",
  "status": "in_transit",
  "locationHash": "abcdef...",
  "photoHash": "1234abcd...",
  "txHash": "ff00ee...",
  "dbRef": "https://storage.example.com/2.jpg",
  "checkpointOrder": 1,
  "timestampOnchain": "2026-03-22T00:15:00.000Z",
  "createdAt": "2026-03-22T00:15:00.000Z"
}
```

Errores comunes:

- `400` si falta `photo`
- `400` por validacion Zod
- `401` si falta token
- `403` si el rol del token no esta entre los roles permitidos del endpoint
- `409` si el lote ya esta cerrado
- `500` si la transicion de rol es invalida, porque el error actual no se transforma a `HttpError`
- `500` si `actorId` no existe

Ejemplo con `curl`:

```bash
curl -X POST http://localhost:3000/batches/1/checkpoints \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "photo=@C:/ruta/transporte.jpg" \
  -F "actorId=2" \
  -F "role=transporter" \
  -F "locationHash=abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"
```

Notas importantes:

- El backend no comprueba que `actorId` coincida con el usuario autenticado
- Tampoco obliga a que el `role` enviado coincida con el rol real del usuario autenticado
- El estado del lote cambia automaticamente segun el rol del checkpoint

---

### `GET /verify/:batchId`

Verifica un lote usando su `uuid`, no el ID numerico de base de datos.

Auth requerida:

- No

Parametro:

- `batchId`: en realidad debe ser el `uuid` del lote

Comportamiento:

- Si no encuentra el lote por `uuid`, responde estado `pending` con mensaje `Batch not found`
- Si existe lote y hay `txHash` en el ultimo checkpoint y `contractId`, responde `authenticated`
- Si existe lote pero no se puede reconciliar on-chain, puede responder `pending` o `inconsistent`

Respuesta ejemplo:

```json
{
  "batchUuid": "8f4f8e35-8db4-45e1-b5c8-0a25f1ce7d1a",
  "contractId": "CA...",
  "status": "authenticated",
  "message": "Hashes y trazabilidad consistentes",
  "currentStatus": "delivered",
  "currentRole": "distributor",
  "checkpoints": [
    {
      "role": "producer",
      "status": "harvested",
      "photoHash": "ab12...",
      "timestamp": "2026-03-22T00:00:00.000Z"
    }
  ]
}
```

Ejemplo:

```bash
curl http://localhost:3000/verify/8f4f8e35-8db4-45e1-b5c8-0a25f1ce7d1a
```

Nota importante:

- El nombre del parametro en la ruta es engañoso: `:batchId` pero el servicio busca por `uuid`

## Flujo recomendado de prueba

### 1. Crear usuarios base

Crea al menos estos usuarios:

- un `producer`
- un `transporter`
- un `inspector`
- un `distributor`
- opcionalmente un `admin`

Guarda:

- `id`
- `role`
- `walletPublicKey`
- `accessToken`

### 2. Crear lote con productor o admin

Usa `POST /batches` con:

- token de `producer` o `admin`
- `producerId` del usuario productor
- una foto real
- `locationHash` valido de 64 caracteres

Guarda:

- `id` del lote
- `uuid`
- `contractId`

### 3. Consultar el lote

Llama:

- `GET /batches/:id`
- `GET /batches/:id/history`

Comprueba:

- `status = harvested`
- `currentRole = producer`
- existe checkpoint con `checkpointOrder = 0`

### 4. Avanzar checkpoints

Secuencia correcta:

1. `transporter`
2. `inspector`
3. `distributor`

Despues de cada paso, revisa:

- `GET /batches/:id`
- el nuevo `status`
- el `currentRole`
- que `checkpointOrder` suba de forma incremental

### 5. Verificar trazabilidad publica

Usa:

- `GET /verify/:uuid`

No uses el ID numerico aqui.

## Ejemplos de datos listos para probar

### Usuario productor

```json
{
  "organizationId": null,
  "email": "producer@example.com",
  "password": "Password123",
  "fullName": "Producer One",
  "role": "producer",
  "walletPublicKey": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
}
```

### Usuario transportista

```json
{
  "organizationId": null,
  "email": "transporter@example.com",
  "password": "Password123",
  "fullName": "Transporter One",
  "role": "transporter",
  "walletPublicKey": "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBC"
}
```

### Lote

```text
producerId=1
productName=Guacamole Hass
variety=Hass
weightKg=120.5
notes=Lote inicial de prueba
locationHash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## Errores y detalles a tener en cuenta

- Los endpoints `GET /batches/:id` y algunos fallos internos devuelven `500` cuando semanticamente deberian ser `404` o `400`
- `POST /batches/:id/checkpoints` acepta `role=producer` por schema, pero la logica real de transicion no lo permite para avanzar un lote ya creado
- `GET /verify/:batchId` realmente espera el `uuid`
- Las respuestas de `login` y `register` incluyen `passwordHash`; para entorno productivo esto no deberia exponerse
- No hay validacion cruzada entre token autenticado y `producerId` o `actorId`

## Recomendacion para Postman

Crea estas variables de coleccion:

- `baseUrl` = `http://localhost:3000`
- `producerToken`
- `transporterToken`
- `inspectorToken`
- `distributorToken`
- `batchId`
- `batchUuid`

Luego prueba en este orden:

1. `GET {{baseUrl}}/health`
2. `POST {{baseUrl}}/users` para cada rol
3. `POST {{baseUrl}}/auth/login` si quieres regenerar tokens
4. `POST {{baseUrl}}/batches`
5. `GET {{baseUrl}}/batches/{{batchId}}`
6. `POST {{baseUrl}}/batches/{{batchId}}/checkpoints` con `transporter`
7. `POST {{baseUrl}}/batches/{{batchId}}/checkpoints` con `inspector`
8. `POST {{baseUrl}}/batches/{{batchId}}/checkpoints` con `distributor`
9. `GET {{baseUrl}}/verify/{{batchUuid}}`

## Archivo fuente principal

La definicion de rutas esta en:

- `backend/src/app.ts`

