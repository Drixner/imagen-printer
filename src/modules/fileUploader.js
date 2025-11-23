// src/modules/fileUploader.js
import { create } from 'filepond';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, formatFileSize } from '../utils/constants.js';

class FileUploader {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.pond = null;
    this.onFileLoad = options.onFileLoad || (() => {});
    this.onFileRemove = options.onFileRemove || (() => {});
    this.onError = options.onError || (() => {});
    
    this.init();
  }

  /**
   * Inicializa FilePond con configuración personalizada
   */
  init() {
    if (!this.container) {
      throw new Error('Contenedor no encontrado');
    }

    // Configuración de FilePond
    const pondOptions = {
      // Archivos aceptados
      acceptedFileTypes: SUPPORTED_FORMATS,
      
      // Tamaño máximo de archivo
      maxFileSize: MAX_FILE_SIZE,
      
      // Textos en español
      labelIdle: `
        <div class="filepond-label-content">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div class="upload-text">
            <p class="upload-main">Arrastra tu imagen aquí</p>
            <p class="upload-sub">o <span class="upload-browse">busca en tu computadora</span></p>
            <p class="upload-formats">Formatos: JPG, PNG, WEBP, BMP (máx. ${formatFileSize(MAX_FILE_SIZE)})</p>
          </div>
        </div>
      `,
      
      labelInvalidField: 'El archivo contiene campos inválidos',
      labelFileWaitingForSize: 'Esperando tamaño del archivo',
      labelFileSizeNotAvailable: 'Tamaño no disponible',
      labelFileLoading: 'Cargando archivo...',
      labelFileLoadError: 'Error al cargar archivo',
      labelFileProcessing: 'Procesando...',
      labelFileProcessingComplete: 'Procesado correctamente',
      labelFileProcessingAborted: 'Procesamiento cancelado',
      labelFileProcessingError: 'Error al procesar',
      labelFileProcessingRevertError: 'Error al revertir',
      labelFileRemoveError: 'Error al eliminar',
      labelTapToCancel: 'Toca para cancelar',
      labelTapToRetry: 'Toca para reintentar',
      labelTapToUndo: 'Toca para deshacer',
      labelButtonRemoveItem: 'Eliminar',
      labelButtonAbortItemLoad: 'Cancelar',
      labelButtonRetryItemLoad: 'Reintentar',
      labelButtonAbortItemProcessing: 'Cancelar',
      labelButtonUndoItemProcessing: 'Deshacer',
      labelButtonRetryItemProcessing: 'Reintentar',
      labelButtonProcessItem: 'Procesar',
      
      // Mensajes de error personalizados
      labelMaxFileSizeExceeded: 'Archivo demasiado grande',
      labelMaxFileSize: `Tamaño máximo: ${formatFileSize(MAX_FILE_SIZE)}`,
      labelFileTypeNotAllowed: 'Tipo de archivo no permitido',
      
      // Configuración funcional
      allowMultiple: false,
      allowReplace: true,
      allowRevert: false,
      allowRemove: true,
      allowProcess: false,
      allowBrowse: true,
      allowDrop: true,
      allowPaste: false,
      
      // Validación de imágenes
      allowImageValidate: true,
      imageValidateSizeMinWidth: 100,
      imageValidateSizeMinHeight: 100,
      imageValidateSizeMaxWidth: 10000,
      imageValidateSizeMaxHeight: 10000,
      
      // Callbacks
      onaddfile: (error, file) => {
        if (error) {
          this.handleError(error.main || 'Error al agregar archivo');
          return;
        }
        this.handleFileAdd(file);
      },
      
      onremovefile: (error, file) => {
        if (error) {
          this.handleError(error.main || 'Error al eliminar archivo');
          return;
        }
        this.handleFileRemove(file);
      },
      
      onwarning: (error, file) => {
        this.handleError(error.main || 'Advertencia en archivo');
      }
    };

    // Crear instancia de FilePond
    this.pond = create(this.container, pondOptions);
    
    // Agregar estilos personalizados
    this.addCustomStyles();
  }

  /**
   * Maneja la adición de archivos
   * @param {Object} file - Archivo de FilePond
   */
  async handleFileAdd(file) {
    try {
      // Validar formato
      if (!this.isValidFormat(file.file)) {
        throw new Error('Formato de archivo no soportado');
      }

      // Validar tamaño
      if (file.file.size > MAX_FILE_SIZE) {
        throw new Error(`Archivo demasiado grande. Máximo: ${formatFileSize(MAX_FILE_SIZE)}`);
      }

      // Crear objeto de información del archivo
      const fileInfo = {
        file: file.file,
        name: file.file.name,
        size: file.file.size,
        type: file.file.type,
        lastModified: file.file.lastModified,
        formattedSize: formatFileSize(file.file.size)
      };

      // Llamar callback
      await this.onFileLoad(fileInfo);
      
    } catch (error) {
      this.handleError(error.message);
      this.pond.removeFile(file.id);
    }
  }

  /**
   * Maneja la eliminación de archivos
   * @param {Object} file - Archivo de FilePond
   */
  handleFileRemove(file) {
    this.onFileRemove(file);
  }

  /**
   * Maneja errores
   * @param {string} message - Mensaje de error
   */
  handleError(message) {
    console.error('FileUploader Error:', message);
    this.onError(message);
  }

  /**
   * Valida el formato del archivo
   * @param {File} file - Archivo a validar
   * @returns {boolean}
   */
  isValidFormat(file) {
    return SUPPORTED_FORMATS.includes(file.type);
  }

  /**
   * Obtiene información del archivo actual
   * @returns {Object|null}
   */
  getCurrentFile() {
    const files = this.pond.getFiles();
    if (files.length === 0) return null;
    
    const file = files[0];
    return {
      file: file.file,
      name: file.file.name,
      size: file.file.size,
      type: file.file.type,
      formattedSize: formatFileSize(file.file.size)
    };
  }

  /**
   * Limpia el uploader
   */
  clear() {
    if (this.pond) {
      this.pond.removeFiles();
    }
  }

  /**
   * Verifica si hay archivos cargados
   * @returns {boolean}
   */
  hasFiles() {
    return this.pond && this.pond.getFiles().length > 0;
  }

  /**
   * Agrega estilos personalizados para FilePond
   */
  addCustomStyles() {
    const styleId = 'filepond-custom-styles';
    
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
   style.textContent = `
      .filepond--root {
        font-family: inherit;
      }
      
      .filepond--panel-root {
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        transition: all 0.2s ease;
      }
      
      .filepond--panel-root:hover {
        border-color: #3b82f6;
        background: #f1f5f9;
      }
      
      .filepond--drop-label {
        color: #64748b;
        font-size: 14px;
        min-height: 100px;
      }
      
      .filepond-label-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem 1rem;
        padding-top: 150px;
      }
      
      .upload-icon {
        margin-bottom: 1rem;
        color: #94a3b8;
      }
      
      .upload-text {
        text-align: center;
      }
      
      .upload-main {
        font-size: 1.125rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
      }
      
      .upload-sub {
        color: #64748b;
        margin-bottom: 0.5rem;
      }
      
      .upload-browse {
        color: #3b82f6;
        font-weight: 500;
        cursor: pointer;
      }
      
      .upload-formats {
        font-size: 0.875rem;
        color: #94a3b8;
      }
      
      .filepond--item {
        margin: 0.5rem;
      }
      
      .filepond--item-panel {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      
      .filepond--file-info-main {
        color: #334155;
        font-weight: 500;
      }
      
      .filepond--file-info-sub {
        color: #64748b;
      }
      
      .filepond--file-status-main {
        color: #059669;
      }
      
      .filepond--file-status-sub {
        color: #6b7280;
      }
      
      .filepond--action-remove-item {
        background: #ef4444;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
      }
      
      .filepond--action-remove-item:hover {
        background: #dc2626;
      }
      
      .filepond--progress-indicator {
        color: #3b82f6;
      }
      
      .filepond--file-action-button {
        cursor: pointer;
      }
      
      @media (max-width: 768px) {
        .filepond-label-content {
          padding: 1.5rem;
        }
        
        .upload-main {
          font-size: 1rem;
        }
        
        .upload-icon svg {
          width: 32px;
          height: 32px;
        }
      }
    `; 
    
    document.head.appendChild(style);
  }

  /**
   * Destruye la instancia de FilePond
   */
  destroy() {
    if (this.pond) {
      this.pond.destroy();
      this.pond = null;
    }
  }
}

export default FileUploader;