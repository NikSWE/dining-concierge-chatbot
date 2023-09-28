import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

export class IdentityStack extends Stack {
    readonly lexAccessRoleForLambda: Role;
    readonly apiGatewayCloudWatchRole: Role;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.lexAccessRoleForLambda = new Role(this, 'LexAccessRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                LexAccessPolicyForLambda: this.getLexAccessPolicyForLambda()
            }
        });

        this.apiGatewayCloudWatchRole = new Role(this, 'APIGatewayCloudWatchPolicy', {
            assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
            inlinePolicies: {
                APIGatewayCloudWatchPolicy: this.getAPIGatewayCloudWatchPolicy()
            }
        });
    }

    private getLexAccessPolicyForLambda(): PolicyDocument {
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
                }),
                new PolicyStatement({
                    actions: [
                        'cloudwatch:CreateLogGroup',
                        'cloudwatch:CreateLogStream',
                        'cloudwatch:PutLogEvents'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        })
    }

    private getAPIGatewayCloudWatchPolicy() {
        return new PolicyDocument( {
            statements: [
                new PolicyStatement({
                    actions: [
                        'cloudwatch:CreateLogGroup',
                        'cloudwatch:CreateLogStream',
                        'cloudwatch:PutLogEvents'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['*']
                })
            ]
        });
    }
}