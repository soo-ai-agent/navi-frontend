import {defineConfig} from "@playwright/test";
import {fileURLToPath} from "node:url";

const backendDirectory: string = process.env.E2E_BACKEND_DIR ?? fileURLToPath(new URL("../backend", import.meta.url));
const reportDirectory: string = `docs/reports/${new Date().toISOString().replaceAll(":", "-")}-api-connection-${process.pid}`;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    workers: 1,
    reporter: [["list"], ["html", {outputFolder: `${reportDirectory}/html`, open: "never"}]],
    outputDir: `${reportDirectory}/results`,
    use: {
        baseURL: "http://127.0.0.1:15173",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        launchOptions: {executablePath: process.env.E2E_BROWSER_PATH},
    },
    webServer: [
        {
            command: "venv/bin/python -m uvicorn test.e2e_server:app --host 127.0.0.1 --port 18000",
            cwd: backendDirectory,
            url: "http://127.0.0.1:18000/openapi.json",
            reuseExistingServer: false,
        },
        {
            command: "npm run dev -- --host 127.0.0.1 --port 15173 --strictPort",
            url: "http://127.0.0.1:15173",
            env: {VITE_BACKEND_URL: "http://127.0.0.1:18000"},
            reuseExistingServer: false,
        },
    ],
});
