import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const NGINX_SOURCE = readFileSync(resolve(__dirname, "../nginx.conf"), "utf8");

describe("webapp nginx static asset routing", () => {
	it("serves a reload module instead of index.html for missing hashed js chunks", () => {
		expect(NGINX_SOURCE).toContain("location ~ ^/assets/.+\\.js$");
		expect(NGINX_SOURCE).toContain("try_files $uri @stale_asset_chunk");
		expect(NGINX_SOURCE).toContain("location @stale_asset_chunk");
		expect(NGINX_SOURCE).toContain("window.location.reload(); export default function StaleChunkReload");
	});

	it("keeps the HTML shell uncached so deploys do not retain stale chunk names", () => {
		expect(NGINX_SOURCE).toContain("location = /index.html");
		expect(NGINX_SOURCE).toContain("no-store, no-cache, must-revalidate");
	});

	it("still 404s missing non-js assets", () => {
		expect(NGINX_SOURCE).toContain("location /assets/");
		expect(NGINX_SOURCE).toContain("try_files $uri =404");
	});
});
