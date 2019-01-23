#!/usr/bin/env ts-node

import { getText } from './src/ocr/Ocr';
import { configuration } from './configuration';
import { search } from './src/ocr/Search';

async function doStuff() {
  console.log(`Running OCR`);
  const text = await getText(
    // '/Users/gchampion/github/media-analyzer/media/d2f9c75c-1e33-4ee4-aa88-d19535131f0a.jpeg',
    `${__dirname}/media/ad8aa7e2-cf02-492c-94c4-bd93b3bce871.jpeg`,
    `${__dirname}/media/user-words.txt`,
  );
  console.log(`Found text: ${text}`);
  console.log(`Searching text`);
  const result = await search(configuration.badIngredients, text);

  console.log(`RESULT: ${JSON.stringify(result, null, 2)}`);
}

doStuff().then(() => {
  console.log('all done');
});
