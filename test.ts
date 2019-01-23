#!/usr/bin/env ts-node

import { getText } from './src/ocr/Ocr';
import { badIngredients } from './find';
import { search } from './src/ocr/Search';

async function doStuff() {
  console.log(`Running OCR`);
  const text = await getText(
    // '/Users/gchampion/github/media-analyzer/media/d2f9c75c-1e33-4ee4-aa88-d19535131f0a.jpeg',
    '/Users/gchampion/github/media-analyzer/media/IMG_20190123_100256.jpg',
    '/Users/gchampion/github/media-analyzer/media/user-words.txt',
  );
  console.log(`Found text: ${text}`);
  console.log(`Searching text`);
  const result = await search(badIngredients, text);

  console.log(`RESULT: ${JSON.stringify(result, null, 2)}`);
}

doStuff().then(() => {
  console.log('all done');
});
