import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Queue} from "aws-cdk-lib/aws-sqs";

export class SqsStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const queue = new Queue(this, 'DiningConciergeChatbotQueue', {
            fifo: true,
            queueName: 'SuggestionRequestQueue.fifo'
        });
    }
}