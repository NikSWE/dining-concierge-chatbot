#!/bin/bash

rm LexCodeHookLambda.cjs
tsc LexCodeHookLambda.ts
mv LexCodeHookLambda.js LexCodeHookLambda.cjs