import { put } from "@vercel/blob";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { glob } from "glob";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

// Verify token is available
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is required but not found in environment"
  );
  process.exit(1);
}

interface AssetMapping {
  originalPath: string;
  blobUrl: string;
  pathname: string;
}

interface UploadResult {
  success: boolean;
  pathname?: string;
  blobUrl?: string;
  error?: string;
}

const CLIENT_SIZE_LIMIT = 4.5 * 1024 * 1024; // 4.5MB in bytes
const MAX_CONCURRENT_UPLOADS = 5; // Limit concurrent uploads
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadWithRetry(
  pathname: string,
  content: Buffer | Readable,
  isLargeFile: boolean,
  attempt: number = 1
): Promise<UploadResult> {
  try {
    const options = {
      access: "public" as const,
      contentType: getContentType(pathname),
      cacheControlMaxAge: 31536000,
      multipart: isLargeFile,
      token: token!,
    };

    const blob = await put(pathname, content, options);

    return {
      success: true,
      pathname,
      blobUrl: blob.url,
    };
  } catch (error) {
    console.error(`Upload attempt ${attempt} failed for ${pathname}:`, error);

    if (attempt < RETRY_ATTEMPTS) {
      console.log(`Retrying upload for ${pathname} in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
      return uploadWithRetry(pathname, content, isLargeFile, attempt + 1);
    }

    return {
      success: false,
      pathname,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to determine content type
function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    mp4: "video/mp4",
    json: "application/json",
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };
  return contentTypes[ext || ""] || "application/octet-stream";
}

async function processFile(file: string): Promise<UploadResult> {
  const filePath = resolve(file);
  const stats = statSync(filePath);
  const isLargeFile = stats.size > CLIENT_SIZE_LIMIT;
  const pathname = file.replace("public/assets/", "");

  console.log(
    `Processing ${pathname} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`
  );

  try {
    const content = isLargeFile
      ? createReadStream(filePath)
      : await readFile(filePath);

    return await uploadWithRetry(pathname, content, isLargeFile);
  } catch (error) {
    return {
      success: false,
      pathname,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function uploadAssets() {
  console.log("Starting asset upload process...");

  try {
    // Get all files in public/assets recursively
    const files = await glob("public/assets/**/*.*");
    console.log(`Found ${files.length} files to process`);

    const assetMap: AssetMapping[] = [];
    const errors: { pathname: string; error: string }[] = [];

    // Process files in chunks to limit concurrent uploads
    for (let i = 0; i < files.length; i += MAX_CONCURRENT_UPLOADS) {
      const chunk = files.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const results = await Promise.all(chunk.map(processFile));

      results.forEach((result) => {
        if (result.success && result.blobUrl) {
          assetMap.push({
            originalPath: `public/assets/${result.pathname}`,
            blobUrl: result.blobUrl,
            pathname: result.pathname!,
          });
          console.log(`✓ Uploaded: ${result.pathname}`);
        } else {
          errors.push({
            pathname: result.pathname!,
            error: result.error || "Unknown error",
          });
          console.error(`✗ Failed: ${result.pathname} - ${result.error}`);
        }
      });

      // Progress update
      console.log(
        `Progress: ${i + chunk.length}/${files.length} files processed`
      );
    }

    // Save asset mapping to JSON file
    if (assetMap.length > 0) {
      const mappingContent = JSON.stringify(assetMap, null, 2);
      await writeFile("src/game/asset-mapping.json", mappingContent);
      console.log("Asset mapping saved to src/game/asset-mapping.json");
    }

    // Final report
    console.log("\nUpload Summary:");
    console.log(`Total files: ${files.length}`);
    console.log(`Successfully uploaded: ${assetMap.length}`);
    console.log(`Failed uploads: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nFailed Uploads:");
      errors.forEach(({ pathname, error }) => {
        console.error(`- ${pathname}: ${error}`);
      });

      // Save error log
      await writeFile(
        "upload-errors.log",
        errors.map((e) => `${e.pathname}: ${e.error}`).join("\n")
      );
      console.log("Error details saved to upload-errors.log");
    }
  } catch (error) {
    console.error("Fatal error during upload process:", error);
    process.exit(1);
  }
}

uploadAssets().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
