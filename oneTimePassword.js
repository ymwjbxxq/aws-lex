const DynamoDB = require("aws-sdk/clients/dynamodb");
const SES = require("aws-sdk/clients/ses");

const dynamoDbClient = new DynamoDB.DocumentClient();
const ses = new SES();

exports.handler = async (intentRequest) => {
   console.log(JSON.stringify(intentRequest));
   
    if(intentRequest.sessionAttributes && intentRequest.sessionAttributes.authenticathed === "true") {
        console.log("Already authenticathed");
        const slots = intentRequest.currentIntent.slots;
        slots.email = intentRequest.sessionAttributes.email;
        slots.otp = intentRequest.sessionAttributes.otp;
        return {
            "dialogAction": {
               "type": "Delegate",
                "slots": slots
            },
            "sessionAttributes": intentRequest.sessionAttributes
        };
    }
   
    if(intentRequest.currentIntent.slots && intentRequest.currentIntent.slots.email && !intentRequest.currentIntent.slots.otp){
        console.log("Email checkpoint");
        const checkIfEmailExist = async function checkIfEmailExist(email) {
            const params = {
              TableName: `bot-allowedUser`,
              Key: {
                "email": email
              },
              ProjectionExpression: "email"
            };
            const document = await dynamoDbClient.get(params).promise();
            return document.Item && document.Item.email;
        };
        
        if(await checkIfEmailExist(intentRequest.currentIntent.slots.email)){
            const opt = function generateOPT(){
                function rand (min, max) {
                  const random = Math.random();
                  return Math.floor(random * (max - min) + min);
                }

                const digits = '0123456789';
                const alphabets = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
                
                const allowsChars = digits + alphabets;
                let password = '';
                while (password.length < 6) {
                  const charIndex = rand(0, allowsChars.length - 1);
                  password += allowsChars[charIndex];
                }
                return password;
            };
            const optGenerated =  opt();
            await ses.sendEmail({
                Destination: {
                  ToAddresses: [intentRequest.currentIntent.slots.email],
                },
                Message: {
                  Body: {
                    Text: { 
                        Data: "Your code is: " + optGenerated
                    },
                  },
            
                  Subject: { Data: "Syndication BOT: one time password" },
                },
                Source: "syndication_team@prosiebensat1digital.de",
            }).promise();
            
            return {
                "dialogAction": {
                    "type": "ElicitSlot",
                    "intentName": intentRequest.currentIntent.name,
                    "slotToElicit": "otp",
                    "slots": intentRequest.currentIntent.slots,
                    "message": {
                        "content": `I have sent you one time password to ${intentRequest.currentIntent.slots.email}, please share it with me`,
                        "contentType": "PlainText"
                    }
                },
                "sessionAttributes": {
                    "email": intentRequest.currentIntent.slots.email,
                    "otp": optGenerated,
                    "authenticathed": "false"
                }
            };
        }
        
        return {
            "sessionAttributes": {
                "authenticathed": "false"
            },
          "dialogAction": {
              "type": "Close",
              "fulfillmentState": "Fulfilled",
              "message": {
                  "contentType": "PlainText",
                  "content": "you are not authorized"
              }
          }
        };
    }
    
    if(intentRequest.currentIntent.slots && intentRequest.currentIntent.slots.email && intentRequest.currentIntent.slots.otp){
        console.log("OPT checkpoint");
        if(intentRequest.currentIntent.slots.otp === intentRequest.sessionAttributes.otp) {
            return {
                "dialogAction": {
                    "type": "Delegate",
                    "slots": intentRequest.currentIntent.slots
                },
                "sessionAttributes": {
                    "email": intentRequest.currentIntent.slots.email,
                    "otp": intentRequest.currentIntent.slots.otp,
                    "authenticathed": "true"
                }
            };
        }
        
        return {
            "sessionAttributes": {
                "authenticathed": "false"
            },
          "dialogAction": {
              "type": "Close",
              "fulfillmentState": "Fulfilled",
              "message": {
                  "contentType": "PlainText",
                  "content": "You are not authorized"
              }
          }
        };
    } 
    
    console.log("start");
    return {
        "sessionAttributes": {
            "authenticathed": "false"
        },
        "dialogAction": {
            "type": "ElicitSlot",
            "intentName": intentRequest.currentIntent.name,
            "slotToElicit": "email",
            "slots": intentRequest.currentIntent.slots
        }
    };
};
