import {Handler, APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import {LexRuntime} from "aws-sdk";

export const handler: Handler = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const lexClient = new LexRuntime();

    if (event.body) {
        const processedRequest = JSON.parse(event.body);
        console.log(processedRequest);

        const response = await lexClient.postText({
            botAlias: 'DiningReservationAlias',
            botName: 'DiningReservation',
            userId: processedRequest.messages[0].unstructured.id,
            inputText: processedRequest.messages[0].unstructured.text
        }).promise();

        if (response && response.message) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
                },
                body: JSON.stringify({
                    messages: [{
                        type: 'PlainText',
                        unstructured: {
                            text: response.message
                        }
                    }]
                })
            };
        }
    }

    return {
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
        },
        body: JSON.stringify({
            message: "No request received",
        })
    };
}