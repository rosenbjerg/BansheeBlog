'use strict';

import postcss  from 'rollup-plugin-postcss'
import resolve  from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble    from 'rollup-plugin-buble'
import copy     from 'rollup-plugin-copy-assets';
import html     from 'rollup-plugin-fill-html';

import nested   from 'postcss-nested';
import presetEnv from "postcss-preset-env";

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/bundle.js',
        format: 'iife',
        sourcemap: true
    },
    plugins: [
        postcss({
            modules: true,
            plugins: [
                nested(),
                presetEnv()
            ],
            extensions: ['.pcss', '.css']
        }),
        resolve({
            jsnext: true,
            main: true,
            browser: true
        }),
        buble({
            jsx: 'h',
            objectAssign: 'Object.assign'
        }),
        commonjs(),
        copy({
            assets: [
                './src/assets'
            ],
        }),
        html({
            template: 'src/index.html',
            filename: 'index.html'
        })
    ]
}