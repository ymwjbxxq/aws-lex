const SQS = require("aws-sdk/clients/sqs");
const sqs = new SQS({ region: process.env.AWS_REGION });

exports.handler = async (intentRequest) => {
  try {
    await sendSqs(intentRequest.currentIntent.slots);
    return {
      "sessionAttributes": intentRequest.sessionAttributes,
      "dialogAction": {
          "type": "ElicitIntent",
          "message": {
            "contentType": "CustomPayload",
            "content": "Sent.\n\nAnything else?"
          }
      }
    };
        
    /*return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
              "contentType": "PlainText",
              "content": "SENT"
            }
        }
    };*/
  } catch (err) {
    console.log(err);
    return {
      "dialogAction": {
          "type": "Close",
          "fulfillmentState": "Fulfilled",
          "message": {
              "contentType": "PlainText",
              "content":`Error ${err}`
          }
      }
    }
  }
};

async function sendSqs(slots) {
    const message = {
      input1: slots.input1,
      input2: slots.input2
    };
    const params = {
      MessageBody: JSON.stringify(message),
      QueueUrl: "SQS_URL"
    };
    await sqs.sendMessage(params).promise();
}
