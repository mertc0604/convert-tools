import vinext from "vinext";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
};
const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumSourceSegmentCount = cesiumSource.split("/").length;
const cesiumRuntimeDirectories = [
  "Assets",
  "ThirdParty",
  "Widgets",
  "Workers",
];

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      viteStaticCopy({
        targets: [
          ...cesiumRuntimeDirectories.map((directory) => ({
            src: `${cesiumSource}/${directory}/**/*`,
            dest: `cesium/${directory}`,
            rename: { stripBase: cesiumSourceSegmentCount + 1 },
          })),
          {
            src: `${cesiumSource}/index.js`,
            dest: "cesium",
            rename: { stripBase: true },
          },
        ],
      }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
