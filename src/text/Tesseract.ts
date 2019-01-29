import tesseract from 'node-tesseract-ocr';

export class TesseractOcr {
  public async  getText(
    imagePath: string,
    englishWordsPath: string,
    chineseWordsPath: string,
  ) {
    const baseConfiguration = { oem: 1, psm: 12 };

    const englishTextPromise = this.getEnglishText(baseConfiguration, imagePath, englishWordsPath);
    const chineseTextPromise = this.getChineseText(baseConfiguration, imagePath, chineseWordsPath);

    return {
      chineseText: await chineseTextPromise,
      englishText: await englishTextPromise,
    };
  }

  public async  getEnglishText(configuration: any, imagePath: string, englishWordsPath: string) {
    configuration.lang = 'eng';
    configuration['user-words'] = englishWordsPath;
    let text: string = (await tesseract.recognize(imagePath, configuration));
    text = text.replace(/[\r\n]+/g, '');
    console.log(`Found English text: ${JSON.stringify(text)}`);
    return text;
  }

  public async  getChineseText(configuration: any, imagePath: string, chineseWordsPath: string) {
    configuration.lang = 'chi_sim';
    configuration['user-words'] = chineseWordsPath;
    let text: string = (await tesseract.recognize(imagePath, configuration));
    text = text.replace(/[\r\n]+/g, '');
    console.log(`Found Chinese text: ${JSON.stringify(text)}`);
    return text;
  }

}
