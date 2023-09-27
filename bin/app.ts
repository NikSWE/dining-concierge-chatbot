import {App, Stack, StackProps} from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3'
import { env } from '../lib/config'
import {Construct} from "constructs";

class DiningConciergeChatbotStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.createStacks();
    }

    createStacks() {
        const s3 = new S3Stack(this, "DiningConciergeS3Stack", {
            env: env
        });
    }
}

const app = new App();
new DiningConciergeChatbotStack(app, 'DiningConciergeChatbotStack', {
    env: env
});