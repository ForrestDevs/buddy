import * as fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";

interface Vertex {
  x: number;
  y: number;
}

// Simplification function using Douglas-Peucker
function douglasPeucker(points: Vertex[], tolerance: number): Vertex[] {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (dist > maxDistance) {
      index = i;
      maxDistance = dist;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance);
    const right = douglasPeucker(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function perpendicularDistance(
  point: Vertex,
  lineStart: Vertex,
  lineEnd: Vertex
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > 0) {
    const projection =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / mag;
    const px = lineStart.x + (projection * dx) / mag;
    const py = lineStart.y + (projection * dy) / mag;
    return Math.sqrt((point.x - px) ** 2 + (point.y - py) ** 2);
  }
  return 0;
}

async function loadAndParseSVG(filePath: string): Promise<Vertex[]> {
  try {
    const svgPath = path.resolve(__dirname, filePath);
    // Read the SVG file
    const svgData = fs.readFileSync(svgPath, "utf-8");

    // Parse the SVG XML
    const parsedSvg = await parseStringPromise(svgData);

    // Prepare an array to store vertices
    const vertices: Vertex[] = [];

    // Traverse the SVG elements and look for paths
    if (parsedSvg && parsedSvg.svg && parsedSvg.svg.path) {
      parsedSvg.svg.path.forEach((path: any) => {
        // Extract the "d" attribute for the path, which contains the commands
        const pathData = path.$.d;
        if (pathData) {
          // Regex to match any command with x and y coordinates
          const vertexRegex = /[MLC] *([0-9.-]+)[ ,]*([0-9.-]+)/g;
          let match;
          while ((match = vertexRegex.exec(pathData)) !== null) {
            const [_, x, y] = match;
            vertices.push({ x: parseFloat(x), y: parseFloat(y) });
          }
        }
      });
    }

    return vertices;
  } catch (error) {
    console.error("Error loading or parsing SVG file:", error);
    throw error;
  }
}

loadAndParseSVG("public/s2.svg")
  .then((vertices) => {
    console.log("Extracted vertices:", vertices);
  })
  .catch((error) => {
    console.error("Failed to extract vertices:", error);
  });

