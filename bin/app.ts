import {App, Stack, StackProps} from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3';
import { ApiGatewayStack } from '../lib/api-gateway';
import { LambdaStack } from '../lib/lamba';
import { IdentityStack } from '../lib/identity';
import { env } from '../lib/config';
import {Construct} from "constructs";

class DiningConciergeChatbotStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.createStacks();
    }

    private createStacks() {
        const identity = new IdentityStack(this, 'DiningConciergeIdentityStack', {
            env: env
        });

        const lambda = new LambdaStack(this, 'DiningConciergeLambdaStack', {
            env: env,
            callLexLambdaRole: identity.lexAccessRoleForLambda
        });
        lambda.addDependency(identity);
        
        const apiGateway = new ApiGatewayStack(this, 'DiningConciergeApiGatewayStack', {
            env: env,
            callLexLambdaFunction: lambda.callLexLambdaFunction,
        });
        apiGateway.addDependency(identity);
        apiGateway.addDependency(lambda);

        const s3 = new S3Stack(this, "DiningConciergeS3Stack", {
            env: env
        });
        s3.addDependency(apiGateway);
    }
}

const app = new App();
new DiningConciergeChatbotStack(app, 'DiningConciergeChatbotStack', {
    env: env
});