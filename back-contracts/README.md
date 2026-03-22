# Guacamole

Base de desarrollo para una plataforma de trazabilidad agricola hibrida sobre Stellar.

## Estructura

- `contracts/`: contratos Soroban en Rust (`factory-contract` y `batch-contract`)
- `backend/`: API en Node.js + TypeScript
- `shared/`: tipos y reglas de dominio compartidas

## Estado

Esta base implementa:

- modelo de dominio para lotes y checkpoints
- contratos Soroban con factory + batch
- backend REST con JWT, MySQL, uploads y gateway Stellar
- esquema SQL inicial
- pruebas base de dominio y contratos

## Requisitos locales

- Rust + Cargo
- Node.js 20+
- MySQL 8+
- Stellar CLI para despliegue real

