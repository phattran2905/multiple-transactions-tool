import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            process: "process/browser",
            stream: "stream-browserify",
            zlib: "browserify-zlib",
            util: "util",
            https: "agent-base",
            assert: "assert"
        }
    },
    plugins: [react()]
})
