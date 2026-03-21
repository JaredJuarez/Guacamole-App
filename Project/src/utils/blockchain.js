/**
 * Simula el minting de un asset en la blockchain Stellar.
 * Para la integración real, reemplazar con llamadas al Stellar SDK / Soroban.
 */
export function mintToBlockchain(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      resolve({
        success: true,
        txHash: hash,
        timestamp: new Date().toISOString(),
        data,
      });
    }, 2000);
  });
}

/**
 * Genera un hash visual a partir de datos arbitrarios.
 */
export async function generateHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    typeof input === "string" ? input : JSON.stringify(input),
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Genera un ID único para un lote.
 */
export function generateLoteId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOTE-${ts}-${rand}`;
}
