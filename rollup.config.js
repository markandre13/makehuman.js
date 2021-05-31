import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
 
export default {
    input: './src/renderer.ts',
    output: {
      name: 'fretboard',
      file: 'dist/renderer.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: "esnext",
                    declaration: true
                },
                include: [ "src" ]
            },
            "useTsconfigDeclarationDir": true,
            sourceMap: true
        }),
        nodeResolve(),
        commonjs()
    ]
}
