import piexif from "piexifjs";

/**
 * Extrae coordenadas GPS de una imagen en base64
 * Retorna { lat, lng } o null si no hay GPS
 */
export async function extractGPSFromImage(base64Image) {
  try {
    // Convertir base64 a binary string
    const binaryString = atob(base64Image.split(",")[1] || base64Image);
    const exifDict = piexif.load(binaryString);

    const gpsIfd = exifDict.get("0th").get(piexif.ImageIFD.GPSInfo);
    if (!gpsIfd) return null;

    const gps = piexif.load(binaryString)["GPS"];
    if (!gps) return null;

    const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
    const lat = gps[piexif.GPSIFD.GPSLatitude];
    const lngRef = gps[piexif.GPSIFD.GPSLongitudeRef];
    const lng = gps[piexif.GPSIFD.GPSLongitude];

    if (!lat || !lng) return null;

    // Converter fracciones a decimal
    const latDecimal =
      lat[0][0] / lat[0][1] +
      lat[1][0] / lat[1][1] / 60 +
      lat[2][0] / lat[2][1] / 3600;
    const lngDecimal =
      lng[0][0] / lng[0][1] +
      lng[1][0] / lng[1][1] / 60 +
      lng[2][0] / lng[2][1] / 3600;

    // Ajustar por referencia (N/S, E/W)
    const latFinal = latRef === "S" ? -latDecimal : latDecimal;
    const lngFinal = lngRef === "W" ? -lngDecimal : lngDecimal;

    return { lat: latFinal, lng: lngFinal };
  } catch {
    // Si no hay EXIF o falla la lectura, retorna null
    return null;
  }
}

/**
 * Obtiene timestamp de EXIF (DateTime de la cámara)
 */
export function getImageTimestamp(base64Image) {
  try {
    const binaryString = atob(base64Image.split(",")[1] || base64Image);
    const exifDict = piexif.load(binaryString);
    const zerosTohs = exifDict["0th"];
    const datetime = zerosTohs.get(piexif.ImageIFD.DateTime);
    return datetime ? datetime : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
