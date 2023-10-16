import {Handler, SQSEvent} from "aws-lambda";
import {SQS, DynamoDB} from "aws-sdk";
import {Client} from "@elastic/elasticsearch";
import {SendEmailCommand, SESClient} from "@aws-sdk/client-ses";

const dynamoDbClient = new DynamoDB();
const elasticSearchClient = new Client({
    node: 'https://search-restaurants-noe3v4hr6z2haev5f4tz4bsll4.us-east-1.es.amazonaws.com/',
});
const sqsClient = new SQS();
const sesClient = new SESClient();

async function getRestaurantId(cuisine: string) {
    const query = {
        index: 'kibana_1',
        body: {
            query: {
                match: {
                    Cuisine: 'chinese'
                }
            }
        }
    };

    let restaurantId: string | null = null;
    try {
        const response = await elasticSearchClient.search(query);

        // @ts-ignore
        console.log('Response: ', response.hits.hits[0]._source.name);

        const hitRandomIndex = Math.floor(Math.random() * response.hits.hits.length);

        // @ts-ignore
        restaurantId = response.hits.hits[hitRandomIndex]._source.id! as string;
    } catch (error) {
        console.error('Error: ', error);
        throw error;
    }

    return restaurantId;
}

async function getRestaurantInformation(cuisine: string, id: string) {
    const params = {
        Key: {
            'cuisine': {
                S: cuisine
            },
            'id': {
                S: id
            }
        },
        TableName: 'Restaurants'
    };

    const response = await dynamoDbClient.getItem(params).promise();
    return response.Item;
}

async function popSqsQueue(receiptHandle: string) {
    try {
        const response = await sqsClient.deleteMessage({
            QueueUrl: 'https://sqs.us-east-1.amazonaws.com/132900788542/SuggestionRequestQueue',
            ReceiptHandle: receiptHandle
        }).promise();
    } catch (error) {
        console.log('Error when deleting from queue: ', error);
    }
}

async function sendReservationEmail() {
    const sendEmailRequest = {
        Source: 'some source',
        Destination: {
            ToAddresses: [
                'email'
            ]
        },
        Message: {
            Subject: {
                Data: `Your reservation for DATE at TIME`
            },
            Body: {
                Text: {
                    Data: 'Reservation Details'
                }
            }
        }
    };

    const command = new SendEmailCommand(sendEmailRequest);

    try {
        const response = await sesClient.send(command);
    } catch (error) {
        console.error('Error: ', error);
    }
}

export const handler: Handler = async function(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
        try {
            const restaurantId = await getRestaurantId(record.messageAttributes.Cuisine.stringValue!);

            const restaurantInformation = await getRestaurantInformation(
                record.messageAttributes.Cuisine.stringValue!,
                restaurantId
            );

            console.log(restaurantInformation);

            await popSqsQueue(record.receiptHandle);
        } catch (error) {
            console.log('Retrying');
        }
    }
}
