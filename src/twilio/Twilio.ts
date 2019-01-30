import { TwilioMessage } from './TwilioMessage';
import v4 from 'uuid/v4';
import requestPromise from 'request-promise-native';
import JSON from 'circular-json';
import { enumerateError } from '../common/ObjectUtil';
import fs from 'fs';
import Twilio from 'twilio';
import { Configuration } from '../../configurationExample';

export async function getFileBytes(twilioMessage: TwilioMessage) {
  const mediaUrl: string = twilioMessage.MediaUrl0;
  try {
    const fileBytes = await downloadFile(mediaUrl);
    return fileBytes;
  } catch (error) {
    console.log(`Error ocurred while downloading file: ${JSON.stringify(error)}`);
    console.log(`Trimmed error: ${JSON.stringify(enumerateError(error))}`);
    throw error;
  }
}

export async function saveFile(twilioMessage: TwilioMessage, basePath: string) {
  const fileBytes = await getFileBytes(twilioMessage);
  const mediaType: string = twilioMessage.MediaContentType0;
  const extension = mediaType.split('/')[1];
  const fileName = v4();
  const savePath = `${basePath}/${fileName}.${extension}`;
  fs.writeFileSync(savePath, fileBytes);
  console.log(`File saved to '${savePath}'`);
  return savePath;
}

async function downloadFile(url: string) {
  const options = {
    url,
    encoding: null,
    resolveWithFullResponse: true,
  };
  const response = await requestPromise.get(options);
  return response.body;
}

export async function sendSms(number: string, message: string, configuration: Configuration) {
  let restOfMessage = message;
  let chunk = 1;
  const maxChunks = restOfMessage.length / 1500;
  while (restOfMessage.length > 1500) {
    const messageChunk = `Message chunk ${chunk} of ${maxChunks}:\n${restOfMessage.slice(0, 1499)}`;
    restOfMessage = restOfMessage.slice(1499);
    await sendSmallSms(number, messageChunk, configuration);
    chunk = chunk + 1;
  }
  return sendSmallSms(number, restOfMessage, configuration);
}

export async function sendSmallSms(number: string, message: string, configuration: Configuration) {
  const twilioClient = Twilio(configuration.twilio.accountSid, configuration.twilio.authToken);
  try {
    console.log(`Sending SMS to ${number}...`);
    await twilioClient.messages.create({
      body: message,
      to: number,
      from: configuration.twilio.number,
    });
  } catch (error) {
    console.log(`Error ocurred while sending Twilio SMS`);
    console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
  }
}
