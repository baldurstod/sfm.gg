import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
//import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-import-css';
import image from '@rollup/plugin-image';

const isProduction = process.env.BUILD === 'production';

const BUILD_OPTIONS = [
	{ mode: 2, output: "application_poweruser.js" },
];

if (isProduction) {
	BUILD_OPTIONS.push(
		{ mode: 0, output: "application.js" },
		{ mode: 1, output: "application_supporter.js" },
	);
}

const BUILDS = [];

for (const buildOption of BUILD_OPTIONS) {
	BUILDS.push(
		{
			input: './src/client/ts/application.ts',
			output: {
				file: `./build/client/js/${buildOption.output}`,
				format: 'esm',
				sourcemap: isProduction,
			},
			plugins: [
				replace({
					preventAssignment: true,
					__patreon_mode__: buildOption.mode,
					__isProduction__: isProduction,
				}),
				css(),
				json({
					compact: true,
				}),
				wasm(
					{
						maxFileSize: 1000000
					}
				),
				image(),
				typescript({ compilerOptions: { target: 'es2023' } }),
				nodeResolve({
					dedupe: ['gl-matrix', 'harmony-ui', 'harmony-browser-utils'],
				}),
				//isProduction ? terser() : null,
				copy({
					copyOnce: true,
					targets: [
						{ src: 'src/client/index.html', dest: 'build/client/' },
						{ src: 'src/client/ads.txt', dest: 'build/client/' },
						{ src: 'src/client/json/', dest: 'build/client/' },
					]
				}),
			]
		}
	)
}

export default BUILDS;
