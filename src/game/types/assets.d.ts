export interface PackFileAsset {
  url: string;
  type: string;
  key: string;
}

export interface PackFile {
  files: {
    [key: string]: PackFileAsset;
  };
  meta?: {
    app: string;
    version: string;
    [key: string]: any;
  };
}

export interface AssetMapping {
  originalPath: string;
  blobUrl: string;
  pathname: string;
} 