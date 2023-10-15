import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Queue, QueueEncryption} from "aws-cdk-lib/aws-sqs";

export class SqsStack extends Stack {
    readonly queue: Queue;
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.queue = new Queue(this, 'DiningConciergeChatbotQueue', {
            queueName: 'SuggestionRequestQueue',
            encryption: QueueEncryption.UNENCRYPTED,
        });
    }
}