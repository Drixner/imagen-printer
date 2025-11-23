import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PAPER_SIZES, convertMmToPx } from "../utils/constants.js";

class PDFGenerator {
  constructor() {
    this.pdfDoc = null;
    this.currentPage = 0;
  }

  /**
   * Inicializa un nuevo documento PDF
   * @param {string} paperSize - 'A4' o 'A3'
   */
  async initDocument(paperSize = "A4") {
    this.pdfDoc = await PDFDocument.create();

    // Configurar metadatos
    this.pdfDoc.setTitle("Imagen Dividida para Impresión");
    this.pdfDoc.setAuthor("Imagen Printer Tool");
    this.pdfDoc.setSubject("Imagen dividida en múltiples páginas");
    this.pdfDoc.setCreator("Imagen Printer");
  }

  /**
   * Genera el PDF con las partes de la imagen
   * @param {Array<Object>} imageParts - Array de partes de imagen
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Uint8Array>}
   */
  async generatePDF(imageParts, options = {}) {
    const {
      paperSize = "A4",
      pattern = null,
      margins = 10,
      addGuides = true,
      addPageNumbers = true,
    } = options;

    try {
      await this.initDocument(paperSize);
      const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const [index, part] of imageParts.entries()) {
        // Determinar orientación basada en el patrón
        const isLandscape = pattern && pattern.landscape === true;

        // Crear nueva página con orientación apropiada
        const pageWidth = isLandscape
          ? PAPER_SIZES[paperSize].heightPx
          : PAPER_SIZES[paperSize].widthPx;
        const pageHeight = isLandscape
          ? PAPER_SIZES[paperSize].widthPx
          : PAPER_SIZES[paperSize].heightPx;

        const page = this.pdfDoc.addPage([pageWidth, pageHeight]);

        // Agregar imagen
        const image = await this.embedImage(part.dataURL);
        await this.addImageToPage(page, image, part.dimensions, margins);

        // Agregar guías si está habilitado
        if (addGuides) {
          this.addCuttingGuides(page, margins);
        }

        // Agregar número de página si está habilitado
        if (addPageNumbers) {
          this.addPageNumber(page, font, index + 1, imageParts.length);
        }

        // Agregar información de la parte
        this.addPartInfo(page, font, part);
      }

      // Generar PDF
      return await this.pdfDoc.save();
    } catch (error) {
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  }

  /**
   * Convierte dataURL a formato compatible con PDF-lib
   * @param {string} dataURL - Data URL de la imagen
   * @returns {Promise<PDFImage>}
   */
  async embedImage(dataURL) {
    const imageData = dataURL.split(",")[1];
    const imageBytes = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));
    return await this.pdfDoc.embedPng(imageBytes);
  }

  /**
   * Agrega una imagen a la página
   * @param {PDFPage} page - Página del PDF
   * @param {PDFImage} image - Imagen a agregar
   * @param {Object} dimensions - Dimensiones de la imagen
   * @param {number} margins - Márgenes en puntos
   */
  async addImageToPage(page, image, dimensions, margins) {
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const maxWidth = pageWidth - margins * 1.2;
    const maxHeight = pageHeight - margins * 1.2;

    // Calcular escala manteniendo proporción
    const scale = Math.min(
      maxWidth / dimensions.width,
      maxHeight / dimensions.height
    );

    const finalWidth = dimensions.width * scale;
    const finalHeight = dimensions.height * scale;

    // Centrar imagen
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });
  }

  /**
   * Agrega guías de corte a la página
   * @param {PDFPage} page - Página del PDF
   * @param {number} margins - Márgenes en puntos
   */
  addCuttingGuides(page, margins) {
    const guideLength = 15; // puntos
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Color gris claro
    const guideColor = rgb(0.8, 0.8, 0.8);

    // Esquinas superior izquierda
    page.drawLine({
      start: { x: margins, y: margins },
      end: { x: margins + guideLength, y: margins },
      color: guideColor,
    });
    page.drawLine({
      start: { x: margins, y: margins },
      end: { x: margins, y: margins + guideLength },
      color: guideColor,
    });

    // Esquina superior derecha
    page.drawLine({
      start: { x: pageWidth - margins - guideLength, y: margins },
      end: { x: pageWidth - margins, y: margins },
      color: guideColor,
    });
    page.drawLine({
      start: { x: pageWidth - margins, y: margins },
      end: { x: pageWidth - margins, y: margins + guideLength },
      color: guideColor,
    });

    // Esquinas inferiores similares...
  }

  /**
   * Agrega número de página
   * @param {PDFPage} page - Página del PDF
   * @param {PDFFont} font - Fuente a usar
   * @param {number} current - Número actual
   * @param {number} total - Total de páginas
   */
  addPageNumber(page, font, current, total) {
    const text = `Página ${current} de ${total}`;
    const textWidth = font.widthOfTextAtSize(text, 10);
    const textHeight = font.heightAtSize(10);

    page.drawText(text, {
      x: page.getWidth() - textWidth - 30,
      y: 20,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  /**
   * Agrega información de la parte
   * @param {PDFPage} page - Página del PDF
   * @param {PDFFont} font - Fuente a usar
   * @param {Object} part - Información de la parte
   */
  addPartInfo(page, font, part) {
    const { position, paperSize, dpi } = part;
    const info = `Posición: Fila ${position.row + 1}, Columna ${
      position.col + 1
    } | ${paperSize} | ${dpi} DPI`;

    page.drawText(info, {
      x: 30,
      y: page.getHeight() - 20,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}

export default PDFGenerator;
