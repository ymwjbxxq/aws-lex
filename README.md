# AWS LEX #

“[Amazon Lex](https://aws.amazon.com/lex/) is a service for building conversational interfaces into any application using voice and text. Amazon Lex provides the advanced deep learning functionalities of automatic speech recognition (ASR) for converting speech to text, and natural language understanding (NLU) to recognize the intent of the text, to enable you to build applications with highly engaging user experiences and lifelike conversational interactions. With Amazon Lex, the same deep learning technologies that power Amazon Alexa are now available to any developer, enabling you to quickly and easily build sophisticated, natural language, conversational bots (“chatbots”).“

## Basics
**Intent**: It represents an action, like FindX
**Utterances**: It is the phrase, like “I want to find x when y”
**Slots**: It is the input parameter, like X and Y

You can find more like:

* ** Lambda initialization and validation**: You can hook a lambda function where you can do some pre-validation or running some logic before the fulfilment of the request.
* ** Confirmation prompt**: It is a question, like “Are you sure?” where the user can answer simple “yes” or “no”
* **Fulfillment**: You can hook a lambada to fulfil the request once all your slots are completed or where you can just add a simple message like “Hi, I am a BOT”.

## The strange part
Lex was announced back in 2017 I think, and today I have found a few strange things:

* You cannot create LEX via CloudFormation
* The AWS console UI is not the best like I have old detached intents or slots that you cannot delete anymore because the UI still give you
“This intent is currently used by a bot named XXX. Unattached intent from XXX „
* You cannot return multiple messages from a Lambda
* While the lambda is executing would be nice to have a kind of “…” or “processing” just to let the user know that something is happening.
* Once you are using the Lambda function the UI still let you set up responses, prompts and they are things that will not work with this combination

Now I am not an expert on this matter, but I am a random guy that builds a BOT and found few basic needs missing but, I have to say is very easy to build one.


## About this project

I have added 3 simple lambda functions:

* **Stats**: open to all users of the BOT it is a lambda that is connecting to CloudWatch and retrieving some stats.

* **OneTimePassword**: it is a lambda used to authenticate the user, nothing major just a POC to restrict few actions on the bot to few users. He will check if your email is in a DynamoDb table and if it is will generate a password and it will send it via SES. You can use this lambda for all your restricted intents the important thing is to add the email and otp slots in the slot of the intent.

* **MyRestrictAction**: it is a lambda that can be called only if you are one of the allowed users.

## BOT part

You have to create a custom bot and create 2 intents:

* Stats
* MyRestrictionAction

Each intent will have its utterance phrases and their slots.

**Stats** intent is composed by:

* 2 Slots: startDate and endDate
* The fulfilment section is hooked to stat lambda

**MyRestrictionAction** intent is composed by:

* 4 Slots: email, otp, input1 and input2
* Lambda initialization and validation is hooked to onTimePassword lambda
* The fulfilment section is hooked to myRestrictAction lambda

## A NOTE

Inside the Lambda, I am returning 
```javaScript
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
```

because in this way I let the user decide what to do next and also to keep the session alive (you can set it up when you create the bot). Now the user could type "I want to do x and Y" and you can catch this with the next Intent.
If you enable the code that I left in the lambda
```javaScript
 return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
              "contentType": "PlainText",
              "content": "Message"
            }
        }
    };
```
You will notice that the session with the user will be terminated and in case the user will request an Intent that required email and otp the BOT will restart the process all over again.
