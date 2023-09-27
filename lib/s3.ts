import {Bucket, BlockPublicAccess, BucketAccessControl} from "aws-cdk-lib/aws-s3";
import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {RemovalPolicy} from "aws-cdk-lib";

export class S3Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, "DiningConciergeChatbotBucket", {
            bucketName: "dining-concierge-chatbot-static-website-bucket",
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
            accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL
        });
    }
}