# Serverless CloudFormation Authorizer Plugin
Kenneth Falck <kennu@sc5.io> 2016

## Overview

Compatibility: Serverless 1.0

This plugin allows you to define your own API Gateway Authorizers as
the Serverless CloudFormation resources and apply them to HTTP endpoints.
Currently the main use case for this is to enable Cognito User Pool
authorizers, which are not yet supported by Serverless 1.0.

## Configuration

You will first need to add a custom authorizer resource in the resources
section of your serverless.yml. Here is an example of a Cognito User Pool
authorizer. To use this example, you need to substitute your own
User Pool ARN on the last line.

    resources:
      Resources:
        MyAuthorizer:
          Type: "AWS::ApiGateway::Authorizer"
          Properties:
            Type: "COGNITO_USER_POOLS"
            Name: "MyUserPoolAuthorizer"
            IdentitySource: "method.request.header.Authorization"
            RestApiId:
              Ref: "ApiGatewayRestApi"
            ProviderARNs:
              - "arn:aws:cognito-idp:eu-west-1:xxxxxxxxxxxx:userpool/eu-west-1_xxxxxxxxx"

Once the above resource has been added, you can configure individual HTTP
endpoints in serverless.yml to use the authorizer. They will refer to it using
the resource name, which is MyAuthorizer in the example.

    functions:
      hello:
        handler: handler.hello
        events:
          - http:
              method: get
              path: hello
              cfAuthorizer: MyAuthorizer

After making the changes, all you need to do is redeploy the service:

    sls deploy
