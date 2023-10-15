import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Domain, EngineVersion} from "aws-cdk-lib/aws-opensearchservice";
import {EbsDeviceVolumeType} from "aws-cdk-lib/aws-ec2";

export class OpenSearchServiceStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const opensearchServiceDomain = new Domain(this, 'Restaurants', {
            version: EngineVersion.ELASTICSEARCH_5_6,
            ebs: {
                volumeSize: 1,
                volumeType: EbsDeviceVolumeType.GP2
            },
            capacity: {
                dataNodeInstanceType: 't3.small.search',
                dataNodes: 1,
                multiAzWithStandbyEnabled: false,
            }
        });
    }
}