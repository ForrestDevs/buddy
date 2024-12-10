import type { PackFile, PackFileAsset, AssetMapping } from '../types/assets';

import assetMapping from '../asset-mapping.json';

export class BlobAssetLoader {
  private scene: Phaser.Scene;
  private assetMap: Map<string, AssetMapping>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.assetMap = new Map(
      assetMapping.map((mapping: AssetMapping) => [mapping.pathname, mapping])
    );
    console.log(this.assetMap);
  }

  async loadPack(packFile: string) {
    const mapping = this.assetMap.get(packFile);
    if (!mapping) {
      throw new Error(`Asset pack ${packFile} not found in blob storage`);
    }

    // Load and parse the pack file
    const response = await fetch(mapping.blobUrl, {
      cache: 'force-cache',
    });
    const pack = await response.json() as PackFile;

    // Keep track of processed files for validation
    const processedFiles = new Set<string>();

    // Process each file in the pack
    for (const [key, asset] of Object.entries(pack.files)) {
      // Remove 'assets/' prefix if it exists
      const assetPath = asset.url.replace('assets/', '');
      const assetMapping = this.assetMap.get(assetPath);
      
      if (!assetMapping) {
        console.warn(`Asset ${asset.url} not found in blob storage`);
        continue;
      }

      // Update URL while preserving the key
      asset.url = assetMapping.blobUrl;
      processedFiles.add(assetPath);

      // Validate that we're maintaining the same key structure
      if (!asset.key) {
        console.warn(`Missing key for asset ${asset.url}`);
      }
    }

    // Optional: Log any mapped files that weren't used
    this.assetMap.forEach((mapping, path) => {
      if (!processedFiles.has(path)) {
        console.debug(`Mapped file not used in pack: ${path}`);
      }
    });

    console.log(pack);

    // Load the modified pack into Phaser
    this.scene.load.addPack(pack);
  }

  getBlobUrl(pathname: string): string | undefined {
    return this.assetMap.get(pathname)?.blobUrl;
  }
} 