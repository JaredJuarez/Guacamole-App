Especificaciones Técnicas: Proyecto
Guacamole (Trazabilidad en Stellar)
1. Introducción a la Tecnología
El sistema utiliza una arquitectura híbrida: Off-chain (Base de Datos y Backend) para
eficiencia y velocidad, y On-chain (Stellar/Soroban) para inmutabilidad y confianza.
Stellar (Soroban): Actúa como el notario digital. Cada lote es un contrato
inteligente que registra eventos críticos.
Backend: Orquesta la validación de datos, generación de hashes y comunicación
con la red Stellar.
Base de Datos (DB): Almacena metadatos pesados (nombres, fotos, descripciones)
para consulta rápida en la App.
2. Lógica de Contratos y Firmas
¿Por qué un contrato por lote?
1. Aislamiento: Un problema en un lote no afecta la validez de otros.
2. Historial Único: Cada contrato tiene su propio “timeline” de firmas desde la
cosecha hasta el destino.
3. Escalabilidad: Permite cerrar contratos una vez que el producto llega al
consumidor, optimizando el almacenamiento en la red.
Frecuencia de Firmas (Eventos de Custodia)
Las firmas se ejecutan cada vez que el lote cambia de manos:
1. Cosecha: Firma el Productor.
2. Logística: Firma el Transportista (Carga).
3. Calidad/Aduana: Firma el Inspector.
4. Recepción: Firma el Distribuidor.
3. Matriz de Datos (DB vs. Blockchain)
Categoría Dato Específico
Guardado
en DB
Mandado
a Stellar Razón Técnica
Identidad Nombre, RFC,
Contacto SÍ NO Privacidad y
ahorro de costos.
Identidad
Public Key
(Wallet) SÍ SÍ
Identificador
único de firma.
Lote ID del Lote
(UUID) SÍ SÍ El ancla de unión
entre sistemas.
Lote
Variedad, Peso,
Notas SÍ NO
Información
operativa
pesada.
Evidencia Foto del
Producto/Carga SÍ NO
Los archivos
multimedia son
pesados.
Veracidad Hash SHA-256
de la foto SÍ SÍ
Garantiza que la
foto no fue
alterada.
Estado Timestamp y
Coordenadas
SÍ SÍ
Prueba
inmutable de
tiempo y lugar.
Transacción Transaction Hash
(TX)
SÍ SÍ
Recibo de la
operación en la
red.
4. Flujo del Sistema (Step-by-Step)
Paso 1: Creación (Productor)
Pantalla: “Nueva Cosecha”.
Acción: El usuario ingresa datos del lote y toma foto.
Back: Guarda en DB, genera Hash de la foto, llama a create_batch en Soroban.
Blockchain: Registra Batch_ID , Producer_Address y Photo_Hash .
Paso 2: Seguimiento (Intermediarios)
Pantalla: “Escanear QR / Firmar Entrega”.
Acción: El transportista/inspector escanea y sube evidencia de estado.
Back: Valida permisos, ejecuta add_checkpoint en el contrato del lote.
Blockchain: Registra la firma del nuevo actor y el nuevo estado.
Paso 3: Verificación (Consumidor)
Pantalla: “Consulta de Origen”.
Acción: Escaneo de QR público.
Back: Consulta la DB para mostrar info visual y consulta Stellar para verificar que
los Hashes coincidan.
Resultado: Si los hashes coinciden, se muestra el sello de “Producto Autenticado”.


Especificaciones Técnicas: Proyecto
Guacamole (Trazabilidad en Stellar)
1. Introducción a la Tecnología
El sistema utiliza una arquitectura híbrida: Off-chain (Base de Datos y Backend) para
eficiencia y velocidad, y On-chain (Stellar/Soroban) para inmutabilidad y confianza.
Stellar (Soroban): Actúa como el notario digital. Cada lote es un contrato
inteligente que registra eventos críticos.
Backend: Orquesta la validación de datos, generación de hashes y comunicación
con la red Stellar.
Base de Datos (DB): Almacena metadatos pesados (nombres, fotos, descripciones)
para consulta rápida en la App.
2. Lógica de Contratos y Firmas
¿Por qué un contrato por lote?
1. Aislamiento: Un problema en un lote no afecta la validez de otros.
2. Historial Único: Cada contrato tiene su propio “timeline” de firmas desde la
cosecha hasta el destino.
3. Escalabilidad: Permite cerrar contratos una vez que el producto llega al
consumidor, optimizando el almacenamiento en la red.
Frecuencia de Firmas (Eventos de Custodia)
Las firmas se ejecutan cada vez que el lote cambia de manos:
1. Cosecha: Firma el Productor.
2. Logística: Firma el Transportista (Carga).
3. Calidad/Aduana: Firma el Inspector.
4. Recepción: Firma el Distribuidor.
3. Matriz de Datos (DB vs. Blockchain)
Categoría Dato Específico
Guardado
en DB
Mandado
a Stellar Razón Técnica
Identidad Nombre, RFC,
Contacto SÍ NO Privacidad y
ahorro de costos.
Identidad
Public Key
(Wallet) SÍ SÍ
Identificador
único de firma.
Lote ID del Lote
(UUID) SÍ SÍ El ancla de unión
entre sistemas.
Lote
Variedad, Peso,
Notas SÍ NO
Información
operativa
pesada.
Evidencia Foto del
Producto/Carga SÍ NO
Los archivos
multimedia son
pesados.
Veracidad Hash SHA-256
de la foto SÍ SÍ
Garantiza que la
foto no fue
alterada.
Estado Timestamp y
Coordenadas
SÍ SÍ
Prueba
inmutable de
tiempo y lugar.
Transacción Transaction Hash
(TX)
SÍ SÍ
Recibo de la
operación en la
red.
4. Flujo del Sistema (Step-by-Step)
Paso 1: Creación (Productor)
Pantalla: “Nueva Cosecha”.
Acción: El usuario ingresa datos del lote y toma foto.
Back: Guarda en DB, genera Hash de la foto, llama a create_batch en Soroban.
Blockchain: Registra Batch_ID , Producer_Address y Photo_Hash .
Paso 2: Seguimiento (Intermediarios)
Pantalla: “Escanear QR / Firmar Entrega”.
Acción: El transportista/inspector escanea y sube evidencia de estado.
Back: Valida permisos, ejecuta add_checkpoint en el contrato del lote.
Blockchain: Registra la firma del nuevo actor y el nuevo estado.
Paso 3: Verificación (Consumidor)
Pantalla: “Consulta de Origen”.
Acción: Escaneo de QR público.
Back: Consulta la DB para mostrar info visual y consulta Stellar para verificar que
los Hashes coincidan.
Resultado: Si los hashes coinciden, se muestra el sello de “Producto Autenticado”.