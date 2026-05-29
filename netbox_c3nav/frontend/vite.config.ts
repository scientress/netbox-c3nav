import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import {fileURLToPath, URL} from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  build: {
    sourcemap: true,
    outDir: '../static/netbox_c3nav/vite',
    lib: {
      entry: {
        map: resolve(import.meta.dirname, 'src/map.ts')
      },
      name: 'netbox_c3nav',
      formats: ['iife'],
    },
    rolldownOptions: {
      // input: {
      //   main: resolve(import.meta.dirname, 'src/map.ts'),
      // },
      // make sure to externalize deps that shouldn't be bundled
      // external: ['leaflet'],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          leaflet: 'L',
        },
        // codeSplitting: {
        //   minSize: 1000,
        //   groups: [
        //     {
        //       name: 'vendor',
        //       test: /node_modules/,
        //     },
        //   ],
        // },
      }
    },
  },
})