import AWS from 'aws-sdk';

export class RekognitionOcr {
  public async  getText(fileBytes) {
    const rekognition = new AWS.Rekognition();
    const parameters = { Image: { Bytes: fileBytes } };
    const textResult: AWS.Rekognition.DetectTextResponse =
      await rekognition.detectText(parameters).promise();
    const detectedText = textResult.TextDetections.map((detection) => {
      console.log(`Found text: ${detection.DetectedText}`);
      return detection.DetectedText;
    });
    return detectedText.join(' ');
  }
}
