import { copyFile, mkdir } from "node:fs/promises";
const output = new URL("../public/maps/", import.meta.url);
await mkdir(output, { recursive: true });
await copyFile(new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url), new URL("maplibre-gl-worker.mjs", output));
await copyFile(new URL("../node_modules/maplibre-gl/LICENSE.txt", import.meta.url), new URL("MAPLIBRE-LICENSE.txt", output));
