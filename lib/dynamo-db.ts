import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

export class DynamoDBStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const restaurantsTable = new Table(this, 'RestaurantsTable', {
            tableName: 'Restaurants',
            partitionKey: {
                name: 'cuisine',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'id',
                type: AttributeType.STRING
            }
        });
    }
}