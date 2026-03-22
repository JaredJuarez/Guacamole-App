# Despliegue de Contratos en Stellar

Esta guia explica como subir a Stellar los contratos de este proyecto y como conectar el backend con el contrato `factory` desplegado.

## Que hay en este proyecto

- `contracts/batch-contract`: contrato plantilla para cada lote.
- `contracts/factory-contract`: contrato factory que despliega nuevos contratos `batch`.
- `backend`: backend que llama al contrato `factory` para crear contratos por lote.

## Flujo real de despliegue

El despliegue de este proyecto ocurre en este orden:

1. Compilar el contrato `batch-contract`.
2. Publicar el WASM de `batch-contract` en Stellar para obtener su `wasm hash`.
3. Compilar y desplegar `factory-contract`.
4. Pasarle al `factory` el `admin` y el `batch_wasm_hash`.
5. Guardar el `contract id` del `factory` en el backend.
6. Dejar que el backend cree contratos `batch` automaticamente llamando a `create_batch`.

## Requisitos previos

Necesitas tener instalado:

- Rust
- Cargo
- `wasm32-unknown-unknown` target
- Stellar CLI
- Una cuenta con fondos en la red que vayas a usar

## Variables y datos que debes tener

Antes de desplegar, define estos datos:

- `NETWORK`: normalmente `testnet`
- `ADMIN_ALIAS`: alias de tu identidad en Stellar CLI, por ejemplo `guacamole-admin`
- `ADMIN_ADDRESS`: direccion publica de esa identidad
- `BATCH_WASM_PATH`: ruta del WASM compilado de `batch-contract`
- `FACTORY_WASM_PATH`: ruta del WASM compilado de `factory-contract`

## Paso 1. Entrar a la carpeta de contratos

Desde la raiz del proyecto:

```powershell
cd contracts
```

## Paso 2. Agregar el target WASM de Rust

Si aun no lo tienes:

```powershell
rustup target add wasm32-unknown-unknown
```

## Paso 3. Compilar los contratos

Compila cada contrato en modo release:

```powershell
cargo build --target wasm32-unknown-unknown --release -p batch-contract
```

```powershell
cargo build --target wasm32-unknown-unknown --release -p factory-contract
```

Los archivos generados deberian quedar en:

- `contracts/target/wasm32-unknown-unknown/release/batch_contract.wasm`
- `contracts/target/wasm32-unknown-unknown/release/factory_contract.wasm`

## Paso 4. Crear o reutilizar una identidad en Stellar CLI

Ejemplo para testnet:

```powershell
stellar keys generate --global guacamole-admin --network testnet --fund
```

Para ver la direccion publica:

```powershell
stellar keys address guacamole-admin
```
GA6C73NWS2JY4OFV5PONNAV6B7KYOHGIW3IRJ4QBWH6CVGXHC2FKLG6K

Guarda esa direccion porque sera el `admin` del contrato `factory`.

## Paso 5. Publicar el WASM de `batch-contract`

Primero publica el codigo WASM del contrato batch. Esto no crea aun un contrato de lote; solo sube el codigo para obtener su hash.

```powershell
stellar contract upload --wasm target/wasm32-unknown-unknown/release/batch_contract.wasm --source guacamole-admin --network testnet
```

Ese comando devuelve un `WASM_HASH`. Guardalo porque el `factory` lo necesita en su constructor.

## Paso 6. Desplegar el contrato `factory-contract`

Ahora despliega el `factory` pasando:

- `admin`: direccion publica del administrador
- `batch_wasm_hash`: hash obtenido en el paso anterior

Ejemplo:

```powershell
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/factory_contract.wasm --source guacamole-admin --network testnet -- --admin GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --batch_wasm_hash TU_WASM_HASH_DEL_BATCH
```

Ese comando devuelve el `FACTORY_CONTRACT_ID`. Guardalo.

## Paso 7. Configurar el backend

En el archivo `.env` del backend debes completar al menos estas variables:

```env
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STELLAR_FACTORY_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Notas:

- `STELLAR_SECRET_KEY` debe ser la clave secreta de la cuenta que firmara las llamadas del backend.
- `STELLAR_FACTORY_CONTRACT_ID` es el id devuelto al desplegar `factory-contract`.

## Paso 8. Verificar que el backend ya puede crear contratos batch

Cuando el backend tenga `STELLAR_SECRET_KEY` y `STELLAR_FACTORY_CONTRACT_ID`, dejara de trabajar en modo `pending` y empezara a invocar el `factory`.

El flujo sera asi:

1. El backend crea un lote en base de datos.
2. Llama al metodo `create_batch` del contrato `factory`.
3. El `factory` despliega un nuevo contrato `batch` usando el `batch_wasm_hash`.
4. El backend guarda el `contractId` devuelto para ese lote.

## Paso 9. Invocacion manual opcional para comprobar el factory

Si quieres comprobar manualmente que el `factory` responde, puedes consultar un lote existente o listar los contratos desplegados.

Ejemplo para listar:

```powershell
stellar contract invoke --id CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --source guacamole-admin --network testnet -- list_batches
```

Ejemplo para buscar un lote por id:

```powershell
stellar contract invoke --id CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --source guacamole-admin --network testnet -- get_batch_address --batch_id "mi-lote-001"
```

## Orden correcto, resumido

No subas primero el `factory` sin tener el hash del `batch`, porque el constructor del `factory` depende de ese valor.

El orden correcto es:

1. Compilar `batch-contract`
2. Publicar `batch-contract` y obtener `WASM_HASH`
3. Compilar `factory-contract`
4. Desplegar `factory-contract` con `admin` y `batch_wasm_hash`
5. Guardar `FACTORY_CONTRACT_ID` en el `.env`
6. Levantar el backend y crear lotes

## Problemas comunes

### El backend devuelve contratos `pending-*`

Eso pasa cuando falta alguno de estos valores:

- `STELLAR_SECRET_KEY`
- `STELLAR_FACTORY_CONTRACT_ID`

### El deploy del factory falla

Revisa:

- que el `batch_wasm_hash` exista y sea el correcto
- que la cuenta fuente tenga fondos
- que estes usando la red correcta
- que el `admin` sea una direccion valida

### El backend firma pero no crea contratos reales

Revisa:

- `STELLAR_RPC_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- que el `FACTORY_CONTRACT_ID` pertenezca a esa misma red

## Referencia rapida de rutas

- `contracts/Cargo.toml`
- `contracts/batch-contract/src/lib.rs`
- `contracts/factory-contract/src/lib.rs`
- `backend/src/services/stellar-service.ts`
- `backend/src/config/stellar.ts`
- `backend/src/config/env.ts`

## Recomendacion final

Para este proyecto, piensa el despliegue asi:

- `batch-contract` se publica como codigo reusable
- `factory-contract` se despliega una sola vez
- cada lote nuevo se crea desde el backend llamando al `factory`

No necesitas desplegar manualmente un contrato `batch` por cada lote si el `factory` ya esta bien configurado.
