import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

interface AssetMapping {
  originalPath: string;
  blobUrl: string;
  pathname: string;
}

interface PackFileAsset {
  type: string;
  key: string;
  url: string | string[];  // url can be string or array for audio files
}

interface PackFileSection {
  files?: PackFileAsset[];
  [key: string]: PackFileSection | PackFileAsset[] | undefined;
}

interface PackFile {
  [key: string]: PackFileSection;
}

async function createBlobPack() {
  try {
    // Load asset mapping
    const mappingContent = await readFile('src/game/asset-mapping.json', 'utf-8');
    const assetMapping: AssetMapping[] = JSON.parse(mappingContent);
    const urlMap = new Map(assetMapping.map(m => [m.pathname, m.blobUrl]));

    // Load all pack files
    const packFiles = [
      'effects/effect-pack.json',
      'weapons/weapon-pack.json',
      'character/character-pack.json',
      'sounds/sound-pack.json',
      'buttons/button-pack.json',
      'backgrounds/bg-pack.json'
    ];

    const consolidatedPack: PackFile = {};

    for (const packFile of packFiles) {
      console.log(`Processing ${packFile}...`);
      const content = await readFile(`public/assets/${packFile}`, 'utf-8');
      const pack = JSON.parse(content);
      
      // Get the section name from the file path
      const section = packFile.split('/')[0];
      
      consolidatedPack[section] = {
        files: []
      };

      // Process each file in the pack
      if (pack.section1?.files) {
        for (const file of pack.section1.files) {
          try {
            // Handle both string and array URLs (for audio files)
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

            consolidatedPack[section].files!.push({
              type: file.type,
              key: file.key,
              url: file.type === 'audio' ? processedUrls : processedUrls[0]
            });
          } catch (error) {
            console.error(`Error processing file in ${packFile}:`, file);
            console.error(error);
          }
        }
      }
    }

    // Save the consolidated pack file
    const outputPath = 'public/assets/blob-pack.json';
    await writeFile(outputPath, JSON.stringify(consolidatedPack, null, 2));
    console.log(`Created blob pack at ${outputPath}`);

    // Create a TypeScript type definition file for the keys
    let typeContent = 'export type AssetKeys =\n';
    for (const [section, data] of Object.entries(consolidatedPack)) {
      if (data.files) {
        typeContent += `  // ${section}\n`;
        data.files.forEach(file => {
          typeContent += `  | '${file.key}'\n`;
        });
      }
    }
    typeContent += ';\n';

    await writeFile('src/game/types/asset-keys.d.ts', typeContent);
    console.log('Created asset keys type definition');

    // Print some statistics
    for (const [section, data] of Object.entries(consolidatedPack)) {
      if (data.files) {
        console.log(`${section}: ${data.files.length} files`);
      }
    }

  } catch (error) {
    console.error('Error creating blob pack:', error);
    process.exit(1);
  }
}

createBlobPack().catch(console.error); 