import FileUploader from "./modules/fileUploader.js";
import ImageProcessor from "./modules/imageProcessor.js";
import PDFGenerator from "./modules/pdfGenerator.js";
import { DIVISION_PATTERNS, DPI_OPTIONS } from "./utils/constants.js";

class App {
  constructor() {
    // Inicializar propiedades
    this.imageProcessor = new ImageProcessor();
    this.currentFile = null;
    this.currentPattern = "A4_2x2";
    this.currentDpi = 300;

    // Referencias DOM
    this.elements = {
      fileInfo: document.getElementById("file-info"),
      fileDetails: document.getElementById("file-details"),
      patternSelect: document.getElementById("division-pattern"),
      dpiSelect: document.getElementById("dpi-selection"),
      patternDescription: document.getElementById("pattern-description"),
      previewContainer: document.getElementById("preview-container"),
      exportButton: document.getElementById("export-pdf"),
      errorToast: document.getElementById("error-toast"),
      errorMessage: document.getElementById("error-message"),
    };

    // Inicializar uploader
    this.initFileUploader();

    // Configurar event listeners
    this.setupEventListeners();
  }

  initFileUploader() {
    this.fileUploader = new FileUploader("file-upload-container", {
      onFileLoad: async (fileInfo) => {
        try {
          this.currentFile = fileInfo;
          await this.handleNewImage(fileInfo.file);
          this.showFileInfo(fileInfo);
          this.elements.exportButton.disabled = false;
        } catch (error) {
          this.showError(error.message);
        }
      },
      onFileRemove: () => {
        this.resetUI();
      },
      onError: (error) => {
        this.showError(error);
      },
    });
  }

  setupEventListeners() {
    // Cambio de patrón
    this.elements.patternSelect.addEventListener("change", (e) => {
      this.currentPattern = e.target.value;
      this.updatePatternDescription();
      if (this.currentFile) {
        this.generatePreview();
      }
    });

    // Cambio de DPI
    this.elements.dpiSelect.addEventListener("change", (e) => {
      this.currentDpi = parseInt(e.target.value);
      if (this.currentFile) {
        this.generatePreview();
      }
    });

    // Botón de exportar
    this.elements.exportButton.addEventListener("click", () => {
      this.exportPDF();
    });
  }

  async handleNewImage(file) {
    try {
      await this.imageProcessor.loadImage(file);
      this.generatePreview();
    } catch (error) {
      throw new Error("Error al procesar la imagen: " + error.message);
    }
  }

  generatePreview() {
    try {
      const previews = this.imageProcessor.generatePreview(this.currentPattern);
      this.renderPreviews(previews);
    } catch (error) {
      this.showError("Error al generar la vista previa");
    }
  }

  renderPreviews(previews) {
    const container = this.elements.previewContainer;
    container.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-2 gap-4";

    previews.forEach((preview, index) => {
      const previewCard = document.createElement("div");
      previewCard.className = "preview-card bg-gray-50 p-4 rounded-lg";

      const img = new Image();
      img.src = preview.dataURL;
      img.className = "max-w-full h-auto mx-auto";

      const info = document.createElement("p");
      info.className = "text-sm text-gray-600 mt-2 text-center";
      info.textContent = `Parte ${preview.partNumber} de ${preview.totalParts}`;

      previewCard.appendChild(img);
      previewCard.appendChild(info);
      grid.appendChild(previewCard);
    });

    container.appendChild(grid);
  }

  showFileInfo(fileInfo) {
    this.elements.fileInfo.classList.remove("hidden");
    this.elements.fileDetails.textContent = `${fileInfo.name} (${fileInfo.formattedSize})`;
  }

  updatePatternDescription() {
    const pattern = DIVISION_PATTERNS[this.currentPattern];
    this.elements.patternDescription.innerHTML = `
      <p class="text-sm text-gray-600">
        ${pattern.description}
      </p>
    `;
  }

  async exportPDF() {
    try {
      if (!this.currentFile) {
        throw new Error("No hay imagen cargada");
      }

      // Obtener las partes de la imagen
      const imageParts = this.imageProcessor.divideImage(
        this.currentPattern,
        this.currentDpi
      );

      // Crear instancia del generador PDF
      const pdfGenerator = new PDFGenerator();

      // Generar el PDF
      const pdfBytes = await pdfGenerator.generatePDF(imageParts, {
        paperSize: DIVISION_PATTERNS[this.currentPattern].paperSize,
        pattern: DIVISION_PATTERNS[this.currentPattern],
        margins: 8,
        addGuides: true,
        addPageNumbers: true,
      });

      // Crear blob y descargar
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Crear link de descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.currentFile.name.split(".")[0]}_divided.pdf`;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      this.showError("Error al generar PDF: " + error.message);
    }
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorToast.classList.remove("hidden");

    setTimeout(() => {
      this.elements.errorToast.classList.add("hidden");
    }, 5000);
  }

  resetUI() {
    this.currentFile = null;
    this.elements.fileInfo.classList.add("hidden");
    this.elements.exportButton.disabled = true;
    this.elements.previewContainer.innerHTML = `
      <div class="text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-lg">Sube una imagen para ver la vista previa</p>
      </div>
    `;
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
