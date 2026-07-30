import { gzipSync } from "node:zlib";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextDirectory = join(repositoryRoot, ".next");
const manifestSuffix = "page_client-reference-manifest.js";

function parseArguments(argv) {
  const options = {
    baseline: undefined,
    label: "current",
    output: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!["--baseline", "--label", "--output"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value.`);
    }
    options[argument.slice(2)] = value;
    index += 1;
  }

  return options;
}

function findRouteManifests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return findRouteManifests(entryPath);
    return entry.name === manifestSuffix ? [entryPath] : [];
  });
}

function parseRouteManifest(manifestPath) {
  const source = readFileSync(manifestPath, "utf8");
  const assignment = source.match(
    /globalThis\.__RSC_MANIFEST\[("(?:[^"\\]|\\.)*")\]\s*=\s*(\{.*\});\s*$/s
  );
  if (!assignment) {
    throw new Error(`Unable to parse route manifest: ${manifestPath}`);
  }

  return {
    routeKey: JSON.parse(assignment[1]),
    manifest: JSON.parse(assignment[2]),
  };
}

function publicRoute(routeKey) {
  if (routeKey === "/page") return "/";
  return routeKey.endsWith("/page") ? routeKey.slice(0, -5) : routeKey;
}

function routeEntryFiles(routeKey, manifest, manifestPath) {
  const appEntry =
    routeKey === "/page" ? "/src/app/page" : `/src/app${routeKey}`;
  const entries = Object.entries(manifest.entryJSFiles);
  const entry =
    entries.find(([key]) => key.endsWith(appEntry)) ??
    entries.find(([key]) => key.endsWith("/src/app/layout"));
  if (!entry) {
    throw new Error(`No App Router entry found in ${manifestPath}`);
  }
  return [...new Set(entry[1])].sort();
}

function measureChunk(chunk) {
  const chunkPath = join(nextDirectory, ...chunk.split("/"));
  if (!existsSync(chunkPath)) {
    throw new Error(`Referenced client chunk does not exist: ${chunkPath}`);
  }
  const content = readFileSync(chunkPath);
  return {
    file: chunk.replaceAll("\\", "/"),
    rawBytes: statSync(chunkPath).size,
    gzipBytes: gzipSync(content, { level: 9 }).length,
  };
}

function routeDeferredFiles(manifestPath) {
  const loadableManifestPath = join(
    dirname(manifestPath),
    "page",
    "react-loadable-manifest.json"
  );
  if (!existsSync(loadableManifestPath)) return [];

  const loadableManifest = JSON.parse(
    readFileSync(loadableManifestPath, "utf8")
  );
  return [
    ...new Set(
      Object.values(loadableManifest).flatMap((entry) =>
        entry.files.filter((file) => file.endsWith(".js"))
      )
    ),
  ].sort();
}

function measureBuild(label) {
  const appDirectory = join(nextDirectory, "server", "app");
  if (!existsSync(appDirectory)) {
    throw new Error(
      "No production build found. Run `npm run build` before measuring bundles."
    );
  }

  const routes = {};
  for (const manifestPath of findRouteManifests(appDirectory)) {
    const { routeKey, manifest } = parseRouteManifest(manifestPath);
    if (routeKey.split("/").some((segment) => segment.startsWith("_"))) {
      continue;
    }
    const chunks = routeEntryFiles(routeKey, manifest, manifestPath).map(
      measureChunk
    );
    const deferredChunks = routeDeferredFiles(manifestPath).map(measureChunk);
    routes[publicRoute(routeKey)] = {
      rawBytes: chunks.reduce((total, chunk) => total + chunk.rawBytes, 0),
      gzipBytes: chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0),
      chunks,
      deferredRawBytes: deferredChunks.reduce(
        (total, chunk) => total + chunk.rawBytes,
        0
      ),
      deferredGzipBytes: deferredChunks.reduce(
        (total, chunk) => total + chunk.gzipBytes,
        0
      ),
      deferredChunks,
    };
  }

  return {
    schemaVersion: 1,
    label,
    buildId: existsSync(join(nextDirectory, "BUILD_ID"))
      ? readFileSync(join(nextDirectory, "BUILD_ID"), "utf8").trim()
      : null,
    generatedAt: new Date().toISOString(),
    measurement:
      "Initial App Router entry JavaScript: unique route entry chunks; raw file bytes and the sum of each chunk compressed independently with gzip level 9.",
    routes: Object.fromEntries(
      Object.entries(routes).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    ),
  };
}

function compareBuilds(baseline, current) {
  const routes = {};
  const routeNames = new Set([
    ...Object.keys(baseline.routes),
    ...Object.keys(current.routes),
  ]);

  for (const route of [...routeNames].sort()) {
    const before = baseline.routes[route];
    const after = current.routes[route];
    if (!before || !after) {
      routes[route] = { baseline: before ?? null, current: after ?? null };
      continue;
    }
    routes[route] = {
      baselineRawBytes: before.rawBytes,
      currentRawBytes: after.rawBytes,
      rawDeltaBytes: after.rawBytes - before.rawBytes,
      baselineGzipBytes: before.gzipBytes,
      currentGzipBytes: after.gzipBytes,
      gzipDeltaBytes: after.gzipBytes - before.gzipBytes,
      baselineDeferredRawBytes: before.deferredRawBytes ?? 0,
      currentDeferredRawBytes: after.deferredRawBytes ?? 0,
      deferredRawDeltaBytes:
        (after.deferredRawBytes ?? 0) - (before.deferredRawBytes ?? 0),
      baselineDeferredGzipBytes: before.deferredGzipBytes ?? 0,
      currentDeferredGzipBytes: after.deferredGzipBytes ?? 0,
      deferredGzipDeltaBytes:
        (after.deferredGzipBytes ?? 0) - (before.deferredGzipBytes ?? 0),
    };
  }

  return {
    schemaVersion: 1,
    baseline,
    current,
    deltas: { routes },
  };
}

function writeReport(report, outputPath) {
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (!outputPath) {
    process.stdout.write(serialized);
    return;
  }

  const absoluteOutput = resolve(repositoryRoot, outputPath);
  writeFileSync(absoluteOutput, serialized);
  process.stdout.write(
    `Wrote ${relative(repositoryRoot, absoluteOutput).split(sep).join("/")}\n`
  );
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const current = measureBuild(options.label);
  const report = options.baseline
    ? compareBuilds(
        JSON.parse(
          readFileSync(resolve(repositoryRoot, options.baseline), "utf8")
        ),
        current
      )
    : current;
  writeReport(report, options.output);
}

main();
