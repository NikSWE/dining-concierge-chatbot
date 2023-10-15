import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam"
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

export interface LambdaStackProps extends StackProps {
    readonly callLexLambdaRole: Role;
    readonly lexCodeHookLambdaRole: Role;
    readonly serviceRequestLambdaRole: Role;
    readonly sqsQueue: Queue;
}

export class LambdaStack extends Stack {
    public readonly callLexLambdaFunction: Function;
    public readonly lexCodeHookLambda: Function;
    public readonly serviceRequestLambda: Function;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        this.callLexLambdaFunction = new Function(this, 'CallLexLambda', {
            functionName: 'CallLexLambda',
            runtime: Runtime.NODEJS_LATEST,
            handler: 'CallLexLambda.handler',
            code: Code.fromAsset('assets/LF0/'),
            role: props.callLexLambdaRole,
            logRetention: RetentionDays.INFINITE
        });

        this.lexCodeHookLambda = new Function(this, 'LexCodeHookLambda', {
            functionName: 'LexCodeHook',
            runtime: Runtime.NODEJS_LATEST,
            handler: 'LexCodeHookLambda.handler',
            code: Code.fromAsset('assets/LF1'),
            logRetention: RetentionDays.INFINITE,
            role: props.lexCodeHookLambdaRole
        });

        this.serviceRequestLambda = new Function(this, 'ServiceRequestLambda', {
            functionName: 'ServiceRequestLambda',
            runtime: Runtime.NODEJS_LATEST,
            handler: 'ServiceRequestLambda.handler',
            code: Code.fromAsset('assets/LF2'),
            logRetention: RetentionDays.INFINITE,
            role: props.serviceRequestLambdaRole
        });
        this.serviceRequestLambda.addEventSource(new SqsEventSource(props.sqsQueue));
    }
}