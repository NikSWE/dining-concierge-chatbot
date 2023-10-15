import {Handler, SQSEvent} from "aws-lambda";
import {config, DynamoDB} from "aws-sdk";
import {Client} from "@elastic/elasticsearch";
import {DynamoGetItem} from "aws-cdk-lib/aws-stepfunctions-tasks";

const dynamoDbClient = new DynamoDB();
const elasticSearchClient = new Client({
    node: 'opensearchservice-doamin-endpoint'
});

async function getRestaurantId(cuisine: string) {
    const query = {
        index: 'index-name',
        body: {
            query: {
                match: {
                    Cuisine: cuisine
                }
            }
        }
    };

    let restaurantId: string | null = null;
    try {
        const response = await elasticSearchClient.search(query);
        console.log('Response: ', response);

        const hitRandomIndex = Math.floor(Math.random() * response.hits.hits.length);

        // @ts-ignore
        restaurantId = response.hits.hits[hitRandomIndex]._source.RestaurantId! as string;
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

export const handler: Handler = async function(event: SQSEvent): Promise<void> {
    for (const record of event.Records) {
        try {
            const restaurantId = await getRestaurantId(record.messageAttributes.Cuisine.stringValue!);

            const restaurantInformation = await getRestaurantInformation(
                record.messageAttributes.Cuisine.stringValue!,
                restaurantId
            );

            console.log(restaurantInformation);
        } catch (error) {
            console.log('Retrying');
        }
    }
}
