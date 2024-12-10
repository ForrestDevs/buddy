import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

interface AssetMapping {
  originalPath: string;
  blobUrl: string;
  pathname: string;
}

interface PackFileAsset {
  type: string;
  key: string;
  url: string | string[];
}

interface PackFileSection {
  files?: PackFileAsset[];
  [key: string]: PackFileSection | PackFileAsset[] | undefined;
}

interface PackFile {
  [key: string]: PackFileSection;
}

async function createBlobPacks() {
  try {
    // Load asset mapping
    const mappingContent = await readFile('src/game/asset-mapping.json', 'utf-8');
    const assetMapping: AssetMapping[] = JSON.parse(mappingContent);
    const urlMap = new Map(assetMapping.map(m => [m.pathname, m.blobUrl]));

    // Create packs directory if it doesn't exist
    const packsDir = 'public/assets/packs';
    await mkdir(packsDir, { recursive: true });

    // Define pack categories with correct paths
    const packCategories = {
      effects: 'effects/effect-pack.json',
      weapons: 'weapons/weapon-pack.json',
      character: 'character/character-pack.json',
      sounds: 'sounds/sound-pack.json',
      buttons: 'buttons/button-pack.json',
      backgrounds: 'backgrounds/bg-pack.json'
    };

    // Process each category separately
    for (const [category, packFile] of Object.entries(packCategories)) {
      console.log(`Processing ${category} pack...`);
      
      const content = await readFile(`public/assets/${packFile}`, 'utf-8');
      const pack = JSON.parse(content);
      
      const blobPack: PackFile = {
        [category]: {
          files: []
        }
      };

      // Process each file in the pack
      if (pack.section1?.files) {
        for (const file of pack.section1.files) {
          try {
            if (file.type === 'audio') {
              // Handle audio files with URL arrays
              const urls = Array.isArray(file.url) ? file.url : [file.url];
              const processedUrls = urls.map((url: string) => {
                const pathname = url.replace('assets/', '');
                const blobUrl = urlMap.get(pathname);
                if (!blobUrl) {
                  console.warn(`No blob URL found for ${pathname}`);
                  return url; // Keep original URL if no blob URL found
                }
                return blobUrl;
              });

              blobPack[category].files!.push({
                type: file.type,
                key: file.key,
                url: processedUrls
              });
            } else {
              // Handle other file types with single URL
              const pathname = file.url.replace('assets/', '');
              const blobUrl = urlMap.get(pathname);

              if (!blobUrl) {
                console.warn(`No blob URL found for ${pathname}`);
                continue;
              }

              blobPack[category].files!.push({
                type: file.type,
                key: file.key,
                url: blobUrl
              });
            }
          } catch (error) {
            console.error(`Error processing file in ${category}:`, file);
            console.error(error);
          }
        }
      }

      // Save to new packs directory
      const outputPath = `${packsDir}/blob-${category}-pack.json`;
      await writeFile(outputPath, JSON.stringify(blobPack, null, 2));
      console.log(`Created ${category} blob pack at ${outputPath}`);
    }

    // Update type definitions
    let typeContent = 'export type AssetKeys =\n';
    for (const category of Object.keys(packCategories)) {
      const packPath = `${packsDir}/blob-${category}-pack.json`;
      const packContent = await readFile(packPath, 'utf-8');
      const pack = JSON.parse(packContent);

      typeContent += `  // ${category}\n`;
      if (pack[category].files) {
        pack[category].files.forEach((file: PackFileAsset) => {
          typeContent += `  | '${file.key}'\n`;
        });
      }
    }
    typeContent += ';\n';

    await writeFile('src/game/types/asset-keys.d.ts', typeContent);
    console.log('Created asset keys type definition');

  } catch (error) {
    console.error('Error creating blob packs:', error);
    process.exit(1);
  }
}

createBlobPacks().catch(console.error); 