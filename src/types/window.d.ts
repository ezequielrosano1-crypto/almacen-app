export interface StorageEntry {
  key: string;
  value: string;
  shared: boolean;
}

export interface StorageDeleteResult {
  key: string;
  deleted: boolean;
  shared: boolean;
}

export interface StorageListResult {
  keys: string[];
  prefix: string;
  shared: boolean;
}

export interface StorageShim {
  // `get` LANZA cuando la clave no existe (línea 47). Contrato preservado.
  get(key: string, shared?: boolean): Promise<StorageEntry>;
  set(key: string, value: string, shared?: boolean): Promise<StorageEntry>;
  delete(key: string, shared?: boolean): Promise<StorageDeleteResult>;
  list(prefix?: string, shared?: boolean): Promise<StorageListResult>;
}

export interface DetectedBarcode {
  rawValue: string;
}

export interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

export interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

declare global {
  interface Window {
    storage: StorageShim;
    // biome-ignore lint/style/useNamingConvention: Nombre estándar de la Web API BarcodeDetector en window
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}
