import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AccountPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class IdentityStack extends Stack {
    readonly callLexLambdaRole: Role;
    readonly lexCodeHookLamdaRole: Role;
    readonly serviceRequestLambdaRole: Role;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.callLexLambdaRole = new Role(this, 'CallLexLambdaRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                LexAccessPolicy: this.getLexAccessPolicy(),
                CloudWatchLogsAccessPolicy: this.getCloudWatchLogsAccessPolicy()
            }
        });

        this.lexCodeHookLamdaRole = new Role(this, 'LexCodeHookLambdaRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                SQSAccessPolicy: this.getSqsAccessPolicy(),
                CloudWatchLogsAccessPolicy: this.getCloudWatchLogsAccessPolicy(),
                DynamoDbAccessPolicy: this.getDynamoDbAccessPolicy()
            }
        });

        this.serviceRequestLambdaRole = new Role(this, 'ServiceRequestLambdaRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                SQSAccessPolicy: this.getSqsAccessPolicy(),
                ElasticSearchServiceAccessPolicy: this.getElasticSearchServiceAccessPolicy(),
                DynamoDbAccessPolicy: this.getDynamoDbAccessPolicy(),
                CloudWatchLogsAccessPolicy: this.getCloudWatchLogsAccessPolicy(),
                SESAccessPermissions: this.getSesAccessPolicy(),
            }
        });
    }

    private getLexAccessPolicy(): PolicyDocument {
        return new PolicyDocument( {
            statements: [
                new PolicyStatement({
                    actions: [
                        'lex:ListBots',
                        'lex:DescribeBot',
                        'lex:GetBot',
                        'lex:GetBots',
                        'lex:PostContent',
                        'lex:PostContent',
                        'lex:PutSession',
                        'lex:GetSession',
                        'lex:DeleteSession',
                        'lex:PostText',
                        'lex:RecognizeUtterance',
                        'lex:StartConversation'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        })
    }

    private getCloudWatchLogsAccessPolicy(): PolicyDocument {
        return new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        });
    }

    private getSqsAccessPolicy(): PolicyDocument {
        return new PolicyDocument( {
            statements: [
                new PolicyStatement({
                    actions: [
                        'sqs:SendMessage',
                        'sqs:ReceiveMessage',
                        'sqs:DeleteMessage',
                        'sqs:GetQueueAttributes',
                        'sqs:GetQueueUrl'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        });
    }

    private getElasticSearchServiceAccessPolicy(): PolicyDocument {
        return new PolicyDocument( {
            statements: [
                new PolicyStatement({
                    actions: [
                        'es:ESHttpGet',
                        'es:ESHttpPost',
                        'es:ESHttpPut'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        });
    }

    private getDynamoDbAccessPolicy(): PolicyDocument {
        return new PolicyDocument( {
            statements: [
                new PolicyStatement({
                    actions: [
                        'dynamodb:GetItem',
                        'dynamodb:Query',
                        'dynamodb:PutItem'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        });
    }

    private getSesAccessPolicy(): PolicyDocument {
        return new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        'ses:SendEmail',
                        'ses:SendRawEmail'
                    ],
                    resources: ['*']
                })
            ]
        });
    }
}