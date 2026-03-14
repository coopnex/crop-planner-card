import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/crop-planner-card.ts',
  output: {
    file: 'dist/crop-planner-card.js',
    format: 'es',
  },
  plugins: [resolve(), typescript()],
};
