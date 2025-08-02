// src/modules/imageProcessor.js

class ImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.originalImage = null;
    this.imageParts = [];
  }

  /**
   * Carga una imagen desde un archivo
   * @param {File} file - Archivo de imagen
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        this.originalImage = img;
        URL.revokeObjectURL(url); // Liberar memoria
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo cargar la imagen'));
      };
      
      img.src = url;
    });
  }

  /**
   * Divide la imagen en partes según el patrón especificado
   * @param {string} pattern - 'A4_2x1', 'A4_1x2', 'A4_2x2', 'A3_SINGLE', 'A3_2x1', 'A3_1x2', 'A3_2x2'
   * @param {number} dpi - DPI para la exportación (default: 300)
   * @returns {Array<ImageData>} Array de partes de la imagen
   */
  divideImage(pattern = 'A4_2x2', dpi = 300) {
    if (!this.originalImage) {
      throw new Error('No hay imagen cargada');
    }

    const { rows, cols, paperSize } = this.getGridDimensions(pattern);
    const originalWidth = this.originalImage.width;
    const originalHeight = this.originalImage.height;
    
    // Calcular tamaño de cada parte
    const partWidth = Math.floor(originalWidth / cols);
    const partHeight = Math.floor(originalHeight / rows);
    
    // Configurar canvas para cada parte
    this.canvas.width = partWidth;
    this.canvas.height = partHeight;
    
    this.imageParts = [];
    
    // Dividir la imagen
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, partWidth, partHeight);
        
        // Calcular posición de origen en la imagen original
        const sourceX = col * partWidth;
        const sourceY = row * partHeight;
        
        // Dibujar la parte de la imagen
        this.ctx.drawImage(
          this.originalImage,
          sourceX, sourceY, partWidth, partHeight,  // Área de origen
          0, 0, partWidth, partHeight               // Área de destino
        );
        
        // Crear objeto con información de la parte
        const partInfo = {
          canvas: this.canvas.cloneNode(),
          imageData: this.ctx.getImageData(0, 0, partWidth, partHeight),
          dataURL: this.canvas.toDataURL('image/png'),
          position: { row, col },
          dimensions: { width: partWidth, height: partHeight },
          paperSize: paperSize,
          dpi: dpi,
          partNumber: row * cols + col + 1,
          totalParts: rows * cols
        };
        
        // Clonar el canvas para esta parte
        const clonedCanvas = document.createElement('canvas');
        clonedCanvas.width = partWidth;
        clonedCanvas.height = partHeight;
        const clonedCtx = clonedCanvas.getContext('2d');
        clonedCtx.putImageData(partInfo.imageData, 0, 0);
        partInfo.canvas = clonedCanvas;
        
        this.imageParts.push(partInfo);
      }
    }
    
    return this.imageParts;
  }

  /**
   * Obtiene las dimensiones de la grilla según el patrón
   * @param {string} pattern - Patrón de división
   * @returns {Object} {rows, cols, paperSize}
   */
  getGridDimensions(pattern) {
    // Importar patrones dinámicamente o usar constantes locales
    const patterns = {
      'A4_2x1': { rows: 2, cols: 1, paperSize: 'A4' },
      'A4_1x2': { rows: 1, cols: 2, paperSize: 'A4' },
      'A4_2x2': { rows: 2, cols: 2, paperSize: 'A4' },
      'A3_SINGLE': { rows: 1, cols: 1, paperSize: 'A3' },
      'A3_2x1': { rows: 2, cols: 1, paperSize: 'A3' },
      'A3_1x2': { rows: 1, cols: 2, paperSize: 'A3' },
      'A3_2x2': { rows: 2, cols: 2, paperSize: 'A3' }
    };
    
    return patterns[pattern] || patterns['A4_2x2'];
  }

  /**
   * Redimensiona una imagen manteniendo la proporción
   * @param {number} maxWidth - Ancho máximo
   * @param {number} maxHeight - Alto máximo
   * @returns {Object} Nuevas dimensiones
   */
  calculateAspectRatio(maxWidth, maxHeight) {
    if (!this.originalImage) return { width: 0, height: 0 };
    
    const imageRatio = this.originalImage.width / this.originalImage.height;
    const maxRatio = maxWidth / maxHeight;
    
    let newWidth, newHeight;
    
    if (imageRatio > maxRatio) {
      newWidth = maxWidth;
      newHeight = maxWidth / imageRatio;
    } else {
      newHeight = maxHeight;
      newWidth = maxHeight * imageRatio;
    }
    
    return { width: Math.floor(newWidth), height: Math.floor(newHeight) };
  }

  /**
   * Genera un preview de la imagen dividida
   * @param {string} pattern - Patrón de división
   * @param {number} previewSize - Tamaño del preview
   * @returns {Array<Object>} Array con información de preview
   */
  generatePreview(pattern = 'A4_2x2', previewSize = 200) {
    if (!this.originalImage) return [];
    
    const parts = this.divideImage(pattern);
    const previews = [];
    
    parts.forEach(part => {
      const previewCanvas = document.createElement('canvas');
      const previewCtx = previewCanvas.getContext('2d');
      
      // Calcular dimensiones del preview manteniendo proporción
      const aspectRatio = part.dimensions.width / part.dimensions.height;
      let previewWidth, previewHeight;
      
      if (aspectRatio > 1) {
        previewWidth = previewSize;
        previewHeight = previewSize / aspectRatio;
      } else {
        previewHeight = previewSize;
        previewWidth = previewSize * aspectRatio;
      }
      
      previewCanvas.width = previewWidth;
      previewCanvas.height = previewHeight;
      
      // Dibujar preview
      previewCtx.drawImage(
        part.canvas,
        0, 0, part.dimensions.width, part.dimensions.height,
        0, 0, previewWidth, previewHeight
      );
      
      previews.push({
        dataURL: previewCanvas.toDataURL('image/png'),
        partNumber: part.partNumber,
        totalParts: part.totalParts,
        paperSize: part.paperSize,
        position: part.position,
        dimensions: { width: previewWidth, height: previewHeight }
      });
    });
    
    return previews;
  }

  /**
   * Obtiene información de la imagen original
   * @returns {Object} Información de la imagen
   */
  getImageInfo() {
    if (!this.originalImage) return null;
    
    return {
      width: this.originalImage.width,
      height: this.originalImage.height,
      aspectRatio: this.originalImage.width / this.originalImage.height,
      size: this.originalImage.src.length // Aproximado
    };
  }

  /**
   * Limpia los recursos
   */
  cleanup() {
    this.imageParts = [];
    this.originalImage = null;
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export default ImageProcessor;