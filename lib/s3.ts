import {BlockPublicAccess, Bucket, BucketAccessControl, HttpMethods} from "aws-cdk-lib/aws-s3";
import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";

export class S3Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, "DiningConciergeChatbotBucket", {
            bucketName: "dining-concierge-chatbot-static-website",
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
            accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            websiteIndexDocument: 'chat.html',
            websiteErrorDocument: 'chat.html',
            cors: [{
                allowedOrigins: ['*'],
                allowedMethods: [HttpMethods.POST],
                allowedHeaders: ['*'],
            }]
        });
    }
}