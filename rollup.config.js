import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/crop-planner-card.ts',
  output: {
    file: 'dist/crop-planner-card.js',
    format: 'es',
  },
  plugins: [resolve(), json(), typescript()],
};
