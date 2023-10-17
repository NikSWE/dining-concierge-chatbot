import boto3
import random

from boto3.dynamodb.conditions import Key
from elasticsearch import Elasticsearch, RequestsHttpConnection
from aws_requests_auth.aws_auth import AWSRequestsAuth
from botocore.exceptions import ClientError

sqs_client = boto3.client('sqs')
ses_client = boto3.client('ses')
dynamodb_client = boto3.client('dynamodb')

queue_url = 'https://sqs.us-east-1.amazonaws.com/132900788542/SuggestionRequestQueue'
elasticsearch_endpoint = 'search-restaurants-manual-ubb7tnfrs5osv6tew7ucbgsuxi.us-east-1.es.amazonaws.com'

request_authorization = AWSRequestsAuth(
    aws_access_key='AKIAR54MBDE7AZ7OGYE3',
    aws_secret_access_key='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',
    aws_region='us-east-1',
    aws_service='es',
    aws_host=elasticsearch_endpoint
)

elasticsearch_client = Elasticsearch(
    hosts=[{
        'host': elasticsearch_endpoint,
        'port': 443
    }],
    http_auth=request_authorization,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

def handler(event, context):
    service_request_dict = sqs_client.receive_message(
        QueueUrl=queue_url,
        MessageAttributeNames=['All'],
        AttributeNames=['All'],
        VisibilityTimeout=0,
        WaitTimeSeconds=0
    )

    service_request = service_request_dict['Messages'][0]
    retry_count = 3
    retry_flag = False

    try:
#         cuisine = service_request['MessageAttributes'].get('Cuisine').get('StringValue').lower()
        cuisine = 'Cuban'
        possible_restaurants = elasticsearch_client.search(
            index='data',
            body={
                'query': {
                    'match': {
                        'cuisine': cuisine
                    }
                }
            }
        )

        restaurant_id = random.choice(possible_restaurants['hits']['hits'])['_source'].get('id')
        restaurant_information = dynamodb_client.get_item(
            TableName='Restaurants',
            Key={
                'cuisine': {
                    'S': cuisine
                },
                'id': {
                    'S': restaurant_id
                }
            }
        )
        # Get attributes: restaurant_information['Items']['Name']
        send_email(
            service_request['MessageAttributes'].get('EmailAddress').get('StringValue'),
            'Restaurant recommendation'
        )

    except ClientError as e:
        print(f'Error: {e}')

    finally:
        sqs_client.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=service_request['ReceiptHandle']
        )

def send_email(email_address, email_body):
    try:
        response = ses_client.send_email(
            Destination={
                'ToAddresses': [
                    email_address
                ]
            },
            Message={
                'Body': {
                    'Text': {
                        'Data': email_body
                    }
                },
                'Subject': {
                    'Data': 'Restaurant Suggestion'
                }
            },
            Source='ishantaldekar1@gmail.com'
        )
        print('Email send')
    except ClientError as e:
        print(e.response['Error']['Message'])
