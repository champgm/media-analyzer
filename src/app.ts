import bodyParser from 'body-parser';
import express from 'express';
import { configuration } from '../configuration';
import { Configuration } from '../configurationExample';
import { enumerateError, notEmpty } from './common/ObjectUtil';
import JSON from 'circular-json';
import { TwilioMessage } from './twilio/TwilioMessage';
import { saveFile, sendSms, getFileBytes } from './twilio/Twilio';
import { search } from './text/Search';
import middleware from 'aws-serverless-express/middleware';
import morgan from 'morgan';
import { TesseractOcr } from './text/Tesseract';
import { RekognitionOcr } from './text/Rekognition';
import { Vision } from './text/Vision';

process.on('unhandledRejection', (error) => {
  console.log(`Unhandled error ocurred`);
  console.log(`${error}`);
  console.log(`${JSON.stringify(error)}`);
  console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
});

export function asyncHandler(handler: (request, response) => Promise<any>) {
  return async (request, response, next) => {
    try {
      console.log(`Received request: ${JSON.stringify(request, null, 2)}`);
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
router.use(middleware.eventContext());

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
      if (notEmpty(twilioMessage.MediaUrl0)) {
        console.log(`Image URL found.`);
        await handleImageWithVision(twilioMessage, configuration);
      } else {
        console.log(`No image URL found, will analyze text.`);
        await handleText(twilioMessage);
      }
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

export async function handleText(twilioMessage: TwilioMessage) {
  await detectBadIngredients(twilioMessage.From, twilioMessage.Body);
}

export async function handleImageWithVision(twilioMessage: TwilioMessage, configuration: Configuration) {
  console.log(`Downloading image...`);
  const fileBytes = await getFileBytes(twilioMessage);
  const visionOcr = new Vision();
  console.log(`Analyzing image...`);
  const textInImage = await visionOcr.getText(fileBytes, configuration);

  const detectedTextMessage = `Detected Text: ${textInImage}`;
  console.log(detectedTextMessage);
  await sendSms(twilioMessage.From, detectedTextMessage, configuration);
  await detectBadIngredients(twilioMessage.From, textInImage);
}

// export async function handleImageWithRekognition(twilioMessage: TwilioMessage) {
//   console.log(`Downloading image...`);
//   const fileBytes = await getFileBytes(twilioMessage);
//   const rekognitionOcr = new RekognitionOcr();
//   console.log(`Analyzing image...`);
//   const textInImage = await rekognitionOcr.getText(fileBytes);

//   const detectedTextMessage = `Detected Text: ${textInImage}`;
//   console.log(detectedTextMessage);
//   await sendSms(twilioMessage.From, detectedTextMessage, configuration);
//   await detectBadIngredients(twilioMessage.From, textInImage, '');
// }

// export async function handleImageLocally(twilioMessage: TwilioMessage) {
//   const tesseractOcr = new TesseractOcr();
//   const basePath = `${__dirname}/../media`;
//   console.log(`Saving file...`);
//   const savePath = await saveFile(twilioMessage, basePath);
//   console.log(`Running OCR...`);
//   const textInImage = await tesseractOcr.getText(
//     savePath,
//     configuration.badEnglishIngredientsPath,
//     configuration.badChineseIngredientsPath,
//   );
//   const detectedTextMessage = `Detected Text: ${JSON.stringify(textInImage, null, 2)}`;
//   console.log(detectedTextMessage);
//   await sendSms(twilioMessage.From, detectedTextMessage, configuration);
//   await detectBadIngredients(twilioMessage.From, textInImage.englishText, textInImage.chineseText);
// }

export async function detectBadIngredients(phoneNumber: string, text: string) {
  console.log(`Searching text...`);
  const searchResults = await search(configuration.badIngredients, text);

  let formattedResult = 'Search Results:';
  Object.keys(searchResults).forEach((badIngredient) => {
    formattedResult = `${formattedResult}\n`;
    const ingredientResults = searchResults[badIngredient];
    ingredientResults.forEach((match) => {
      formattedResult = `${formattedResult}\n  ${match}`;
    });
  });

  console.log(`Sending result...`);
  await sendSms(phoneNumber, formattedResult, configuration);
}

export const expressApp = express();
expressApp.use('/', router);
expressApp.use(morgan('common'));

// Start the local server
// console.log(`Starting API...`);
// try {
//   const port = configuration.port;
//   expressApp.listen(port, () => {
//     console.log(`API Listening on port: ${port}`);
//   });
// } catch (error) {
//   console.log(`Error caught!`);
//   console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
// }
