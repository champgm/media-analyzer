import tesseract from 'node-tesseract-ocr';

export async function getText(imagePath: string, userWordsPath: string) {
  const configuration = {
    'user-words': userWordsPath,
    lang: 'eng',
    oem: 1,
    psm: 12,
    // presets: ['bazaar'],
  };
  let text: string = (await tesseract.recognize(imagePath, configuration));
  text = text.replace(new RegExp('\n', 'g'), '');
  console.log(`Found text: ${JSON.stringify(text)}`);
  return text;
}
