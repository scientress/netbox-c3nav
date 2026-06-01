import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import {fileURLToPath, URL} from "node:url";

export default defineConfig(({ command, mode, isSsrBuild, isPreview}) => {
  const isDevServer: boolean = command === 'serve'

  return {
    base: isDevServer ? '/' : './',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

    build: {
      assetsInlineLimit: (filePath: string, content: Buffer): boolean | undefined => {
        // never inline leaflet assets
        if (filePath.includes('leaflet/dist')) {
          return false
        }
        // default logic for everything else
        return undefined
      },
      sourcemap: true,
      outDir: '../static/netbox_c3nav/vite',
      rolldownOptions: {
        input: {
          map: resolve(import.meta.dirname, 'src/map.ts'),
          'map.css': resolve(import.meta.dirname, 'src/map.scss'),
        },
        // make sure to externalize deps that shouldn't be bundled
        // external: ['leaflet'],
        output: {
          // Filenames
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          // Provide global variables to use in the UMD build for externalized deps
          globals: {
            leaflet: 'L',
          },
          codeSplitting: {
            minSize: 1000,
            groups: [
              {
                name: 'vendor',
                test: /node_modules/,
              },
            ],
          },
        }
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      origin: 'http://localhost:5173',
      hmr: true,
      cors: {
        origin: 'http://127.0.0.1:8000',
      }
    }
  }
})