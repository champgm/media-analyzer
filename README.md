# media-analyzer

This thing is an express app that runs in an AWS Lambda.

It will:
 - Accept images sent via Twilio
 - OCR them with gcloud's Vision API (AWS Rekognition has a 50 word hard limit)
 - Text back the results of the OCR
 - Fuzzy search in the results with a list of bad words you provide
 - Text back the results of the search

Requirements:
 - AWS account & configuration locally
 - gcloud account & configuration stored in ./gcloud.json
 - Twilio account configured to hit API gateway endpoints in AWS

Steps:
 - npm run package-deploy
 - Configure your API Gateway's "Invoke URL" in twilio
   -  It should be in Api Gateway -> APIs -> lambda-api -> Stages -> dev
 - Text your twilio number a picture with a bunch of words