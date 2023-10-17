import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Code, Function, IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam"
import {FilterPattern, LogGroup, RetentionDays, SubscriptionFilter} from "aws-cdk-lib/aws-logs";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {LambdaDestination} from "aws-cdk-lib/aws-logs-destinations";

export interface LambdaStackProps extends StackProps {
    readonly callLexLambdaRole: Role;
    readonly lexCodeHookLambdaRole: Role;
    readonly serviceRequestLambdaRole: Role;
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
            code: Code.fromAsset('assets/LF1/'),
            logRetention: RetentionDays.INFINITE,
            role: props.lexCodeHookLambdaRole
        });


        this.serviceRequestLambda = new Function(this, 'ServiceRequestLambda', {
            functionName: 'ServiceRequestLambda',
            runtime: Runtime.PYTHON_3_10,
            handler: 'ServiceRequestLambda.handler',
            code: Code.fromAsset('assets/LF2/ServiceRequestLambda.zip'),
            logRetention: RetentionDays.INFINITE,
            role: props.serviceRequestLambdaRole,
        });

        const serviceRequestLambdaTriger = new SubscriptionFilter(this, 'LexCodeHookSubsription', {
            logGroup: this.lexCodeHookLambda.logGroup,
            destination: new LambdaDestination(this.serviceRequestLambda as IFunction),
            filterPattern: FilterPattern.allTerms('INFO')
        });
    }
}