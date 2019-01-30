import { Configuration } from '../../configurationExample';
import vision from '@google-cloud/vision';
import { enumerateError } from '../common/ObjectUtil';

interface VisionResponse {
  textAnnotations: {
    description: string;
  }[];
}

export class Vision {
  public async getText(fileBytes: any, configuration: Configuration) {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: configuration.gcloudJsonPath,
    });
    const visionRequest = {
      image: { content: fileBytes },
      features: [{ type: 'TEXT_DETECTION' }],
      imageContext: {
        languageHints: ['en', 'zh'],
      },
    };
    return this.callVision(client, visionRequest);
  }

  public async callVision(client, visionRequest) {
    try {
      const visionResponse: VisionResponse[] = await client.annotateImage(visionRequest);
      console.log(`Got vision response: ${JSON.stringify(visionResponse, null, 2)}`);
      const fullText = visionResponse[0].textAnnotations[0].description;
      const oneLine = fullText.replace(/(\r\n|\n|\r)/gm, ',');
      return oneLine;
    } catch (error) {
      console.log(`An error ocurred with the Vision request: `);
      console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
    }
  }
}
