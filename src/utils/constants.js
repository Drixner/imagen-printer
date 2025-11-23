// src/utils/constants.js

export const PAPER_SIZES = {
  A4: {
    name: "A4",
    width: 210, // mm
    height: 297, // mm
    widthPx: 2480, // px a 300 DPI
    heightPx: 3508, // px a 300 DPI
  },
  A3: {
    name: "A3",
    width: 297, // mm
    height: 420, // mm
    widthPx: 3508, // px a 300 DPI
    heightPx: 4961, // px a 300 DPI
  },
};
//esto es comentario de prueba
export const DPI_OPTIONS = [
  { value: 150, label: "150 DPI - Calidad básica" },
  { value: 300, label: "300 DPI - Calidad estándar" },
  { value: 600, label: "600 DPI - Alta calidad" },
];

export const DIVISION_PATTERNS = {
  A4_2x1: {
    name: "2 Hojas A4 (Vertical)",
    rows: 2,
    cols: 1,
    paperSize: "A4",
    description: "Divide la imagen en 2 hojas A4 verticales",
  },
  A4_1x2: {
    name: "2 Hojas A4 (Horizontal)",
    rows: 1,
    cols: 2,
    paperSize: "A4",
    description: "Divide la imagen en 2 hojas A4 horizontales",
  },
  A4_2x2: {
    name: "4 Hojas A4 (Vertical)",
    rows: 2,
    cols: 2,
    paperSize: "A4",
    description: "Divide la imagen en 4 hojas A4 (2x2) en orientación vertical",
    landscape: false,
  },
  A4_2x2_H: {
    name: "4 Hojas A4 (Horizontal)",
    rows: 2,
    cols: 2,
    paperSize: "A4",
    description:
      "Divide la imagen en 4 hojas A4 (2x2) en orientación horizontal",
    landscape: true,
  },
  A3_SINGLE: {
    name: "1 Hoja A3",
    rows: 1,
    cols: 1,
    paperSize: "A3",
    description: "Imprime la imagen completa en 1 hoja A3",
  },
  A3_2x1: {
    name: "2 Hojas A3 (Vertical)",
    rows: 2,
    cols: 1,
    paperSize: "A3",
    description: "Divide la imagen en 2 hojas A3 verticales",
  },
  A3_1x2: {
    name: "2 Hojas A3 (Horizontal)",
    rows: 1,
    cols: 2,
    paperSize: "A3",
    description: "Divide la imagen en 2 hojas A3 horizontales",
  },
  A3_2x2: {
    name: "4 Hojas A3 (Vertical)",
    rows: 2,
    cols: 2,
    paperSize: "A3",
    description: "Divide la imagen en 4 hojas A3 (2x2) en orientación vertical",
    landscape: false,
  },
  A3_2x2_H: {
    name: "4 Hojas A3 (Horizontal)",
    rows: 2,
    cols: 2,
    paperSize: "A3",
    description:
      "Divide la imagen en 4 hojas A3 (2x2) en orientación horizontal",
    landscape: true,
  },
};

export const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DEFAULT_SETTINGS = {
  dpi: 300,
  paperSize: "A4",
  divisionPattern: "A4_2x2",
  margin: 10, // mm
  quality: 0.9,
};

export const MARGINS = {
  small: 5, // mm
  medium: 10, // mm
  large: 15, // mm
};

// Funciones utilitarias
export const convertMmToPx = (mm, dpi = 300) => {
  return Math.round((mm * dpi) / 25.4);
};

export const convertPxToMm = (px, dpi = 300) => {
  return (px * 25.4) / dpi;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
