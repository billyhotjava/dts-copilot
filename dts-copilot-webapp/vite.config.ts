import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type PluginOption } from "vite";

const publicBase = process.env.VITE_BASE_PATH || "/";

export default defineConfig(() => {
	const port = Number.parseInt(process.env.PORT ?? "3003", 10);
	const analyze = process.env.ANALYZE === "1";

	const plugins: PluginOption[] = [react()];

	if (analyze) {
		plugins.push(
			visualizer({
				open: true,
				filename: "dist/bundle-report.html",
				gzipSize: true,
				brotliSize: true,
			}),
		);
	}

	return {
		base: publicBase,
		plugins,
		server: {
			host: true,
			allowedHosts: true,
			port,
			strictPort: true,
			proxy: {
				"/api/ai": {
					target: "http://localhost:8091",
					changeOrigin: true,
				},
				"/api": {
					target: "http://localhost:8092",
					changeOrigin: true,
				},
			},
		},
		preview: {
			host: true,
			port,
			strictPort: true,
		},
		build: {
			target: "esnext",
			chunkSizeWarningLimit: 700,
			rollupOptions: {
				output: {
					manualChunks: {
						"vendor-react": ["react", "react-dom", "react-router"],
						"vendor-antd": ["antd", "@ant-design/icons"],
						"vendor-echarts": ["echarts", "echarts-for-react", "echarts-wordcloud"],
						"vendor-dataview": ["@jiaminghi/data-view-react"],
						"vendor-dnd": ["react-dnd", "react-dnd-html5-backend", "react-grid-layout"],
					},
				},
			},
		},
		esbuild: {
			target: "esnext",
		},
	};
});
