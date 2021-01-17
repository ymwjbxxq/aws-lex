const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();
const Metrics = {
        Stats: [{
            "Namespace": "LogMetrics",
            "MetricName": "myCustomMatric1",
            "Dimensions":[]
        },
        {
            "Namespace": "LogMetrics",
            "MetricName": "myCustomMatric2",
            "Dimensions":[]
        }]
};

exports.handler = async (intentRequest) => {
    console.log(intentRequest);
    try {
        const metricDataResults = await getMetric(intentRequest);
        return {
          "sessionAttributes": intentRequest.sessionAttributes,
          "dialogAction": {
              "type": "ElicitIntent",
              "message": {
                "contentType": "CustomPayload",
                "content": formatMessage(intentRequest, metricDataResults) + "\n\nAnything else?"
              }
          }
        };
        /*return {
          "dialogAction": {
              "type": "Close",
              "fulfillmentState": "Fulfilled",
              "message": {
                  "contentType": "CustomPayload",
                  "content": formatMessage(intentRequest, metricDataResults) 
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

async function getMetric(intentRequest){
    const params = {
        StartTime: new Date(intentRequest.currentIntent.slots.startDate),
        EndTime: new Date(intentRequest.currentIntent.slots.endDate),
        MetricDataQueries: []
    };
    
    for (var i = Metrics["Stats"].length; i--; ) {
        const stat = Metrics["Stats"][i];
        params.MetricDataQueries.push({
            Id: `m${i}`,
            MetricStat: {
                Metric: { /* required */
                  Dimensions: stat.Dimensions,
                  MetricName: stat.MetricName,
                  Namespace: stat.Namespace
                },
                Period: 2592000, /* required */
                Stat: "Sum", /* required */
              },
            ReturnData: true
        });
    }
    const result = await cloudwatch.getMetricData(params).promise();
    return result.MetricDataResults;
}

function formatMessage(intentRequest, metricDataResults) {
   const messages = [];
   messages.push(`PStats From ${intentRequest.currentIntent.slots.startDate} to ${intentRequest.currentIntent.slots.endDate} ${newLine}`);
    metricDataResults.forEach(item => {
        const count = (item.Values.length > 0) ? item.Values[0] : 0;
        if(count > 0) { 
            messages.push(`*${item.Label}:* ${count}`);
        }
    });
    return messages.join("\n-");
}
