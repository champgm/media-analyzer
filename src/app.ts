import bodyParser from 'body-parser';
import express from 'express';
// import path from 'path';
import { configuration } from '../configuration';
import { enumerateError } from './common/ObjectUtil';
import JSON from 'circular-json';
import { TwilioMessage } from './twilio/TwilioMessage';
import fs from 'fs';
import { saveFile, sendSms } from './twilio/Twilio';
import { getText } from './ocr/Ocr';
import { search } from './ocr/Search';

export function asyncHandler(handler: (request, response) => Promise<any>) {
  return async (request, response, next) => {
    try {
      const responseObject = await handler(request, response);
      response.status(responseObject.code).json(responseObject.payload);
      next();
    } catch (error) {
      next(error);
    } finally {
      console.log(`Request handling complete.`);
    }
  };
}

const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Health Check endpoint
router.get(
  '/status',
  asyncHandler(async () => {
    const ok = {
      code: 200,
      payload: { status: 'ok' },
    };
    return ok;
  }),
);

router.post(
  '/text-analyze',
  asyncHandler(async (request) => {
    const twilioMessage: TwilioMessage = request.body;
    try {
      const basePath = `${__dirname}/../media`;
      console.log(`Saving file...`);
      const savePath = await saveFile(twilioMessage, basePath);
      console.log(`Running OCR...`);
      const textInImage = await getText(
        savePath,
        configuration.badEnglishIngredientsPath,
        configuration.badChineseIngredientsPath,
      );
      await sendSms(twilioMessage.From, `Detected Text: ${JSON.stringify(textInImage, null, 2)}`, configuration);
      console.log(`Searching text...`);
      const englishSearchPromise = search(configuration.badEnglishIngredients, textInImage.englishText);
      const chineseSearchPromise = search(configuration.badChineseIngredients, textInImage.chineseText);
      const searchResults = (await englishSearchPromise).concat(await chineseSearchPromise);
      const stringResults = searchResults.join('\n\n');
      console.log(`Sending result...`);
      await sendSms(twilioMessage.From, stringResults, configuration);
    } catch (error) {
      const errorMessage = `Encountered an error, sorry =(\n ${JSON.stringify(enumerateError(error), null, 2)}`;
      console.log(errorMessage);
      await sendSms(twilioMessage.From, errorMessage, configuration);
    }
    const ok = {
      code: 200,
      payload: { status: 'ok' },
    };
    return ok;
  }),
);

export const expressApp = express();
expressApp.use('/', router);

// Start the local server
console.log(`Starting API...`);
try {
  const port = configuration.port;
  expressApp.listen(port, () => {
    console.log(`API Listening on port: ${port}`);
  });
} catch (error) {
  console.log(`Error caught!`);
  console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
}
