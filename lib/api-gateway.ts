import {Cors, Deployment, JsonSchemaType, LambdaIntegration, Model, RestApi} from "aws-cdk-lib/aws-apigateway";
import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam";

export interface ApiGatewayStackProps extends StackProps {
    readonly callLexLambdaFunction: IFunction,
}

export class ApiGatewayStack extends Stack {
    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);

        const customerServiceApi = new RestApi(this, 'DiningConciergeChatbotCustomerServiceAPI', {
            restApiName: 'execute-api',
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: Cors.DEFAULT_HEADERS,
                allowCredentials: true
            }
        });

        const unstructuredMessageModel = new Model(this, 'UnstructuredMessage', {
            restApi: customerServiceApi,
            contentType: 'application/json',
            modelName: 'DiningConciergeChatbotUnstructuredMessage',
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    id: {
                        type: JsonSchemaType.STRING
                    },
                    text: {
                        type: JsonSchemaType.STRING
                    },
                    timestamp: {
                        type: JsonSchemaType.STRING,
                        format: 'date-time',
                    }
                }
            }
        });

        const errorModel = new Model(this, 'Error', {
            restApi: customerServiceApi,
            contentType: 'application/json',
            modelName: 'DiningConciergeChatbotError',
            schema: {
                properties: {
                    code: {
                        type: JsonSchemaType.INTEGER
                    },
                    message: {
                        type: JsonSchemaType.STRING
                    }
                }
            }
        });

        const messageModel = new Model(this, 'Message', {
            restApi: customerServiceApi,
            contentType: 'application/json',
            modelName: 'DiningConciergeChatbotMessage',
            schema: {
                properties: {
                    type: {
                        type: JsonSchemaType.STRING
                    },
                    unstructured: {
                        type: JsonSchemaType.OBJECT,
                        ref: this.getModelRef(customerServiceApi, unstructuredMessageModel)
                    }
                }
            }
        });
        messageModel.node.addDependency(unstructuredMessageModel);

        const botRequestModel = new Model(this, 'BotRequest', {
            restApi: customerServiceApi,
            contentType: 'application/json',
            modelName: 'DiningConciergeChatbotBotRequest',
            schema: {
                properties: {
                    messages: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.OBJECT,
                            ref: this.getModelRef(customerServiceApi, messageModel)
                        }
                    }
                }
            }
        });
        botRequestModel.node.addDependency(messageModel);

        const botResponseModel = new Model(this, 'BotResponse', {
            restApi: customerServiceApi,
            contentType: 'application/json',
            modelName: 'DiningConciergeChatbotBotResponse',
            schema: {
                properties: {
                    messages: {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.OBJECT,
                            ref: this.getModelRef(customerServiceApi, messageModel)
                        }
                    }
                }
            }
        });
        botResponseModel.node.addDependency(messageModel);

        const resource = customerServiceApi.root.addResource('chatbot');
        const postMethod = resource.addMethod('POST', new LambdaIntegration(props.callLexLambdaFunction));

        postMethod.addMethodResponse({
            statusCode: '200',
            responseModels: {
                'application/json': botResponseModel,
            }
        });

        postMethod.addMethodResponse({
            statusCode: '403',
            responseModels: {
                'application/json': errorModel,
            },
        });

        postMethod.addMethodResponse({
            statusCode: '500',
            responseModels: {
                'application/json': errorModel,
            }
        });
    }

    private getModelRef(api: RestApi, model: Model): string {
        return `https://apigateway.amazonaws.com/restapis/${api.restApiId}/models/${model.modelId}`;
    }
}