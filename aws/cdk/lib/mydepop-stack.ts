import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";

import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as authorizers from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export class MyDepopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //vpc
    const vpc = new ec2.Vpc(this, "MyDepopVpc", {
      natGateways: 1,
      maxAzs: 2,
    });

    //db secret + rds postgres
    const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "mydepop" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    const db = new rds.DatabaseInstance(this, "MyDepopDb", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      securityGroups: [dbSecurityGroup],
      publiclyAccessible: false,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName: "mydepop",
    });

    //S3 uploads bucket (private)
    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //cognito user pool + client
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false,
      authFlows: { userPassword: true, userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        //will fill in callback/logout urls later when frontend is set
        callbackUrls: ["http://localhost:5173/callback"],
        logoutUrls: ["http://localhost:5173"],
      },
    });

    //lambdas stubs for now
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    //allowing lambdas to connect to the db
    dbSecurityGroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), "Lambda to Postgres");

    const apiFn = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "handler.main",
      code: lambda.Code.fromAsset("../lambdas/api"),
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName,
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_HOST: db.dbInstanceEndpointAddress,
        DB_NAME: "mydepop",
      },
      timeout: cdk.Duration.seconds(30),
    });

    const ingestFn = new lambda.Function(this, "IngestLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "handler.main",
      code: lambda.Code.fromAsset("../lambdas/ingest_csv"),
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName,
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_HOST: db.dbInstanceEndpointAddress,
        DB_NAME: "mydepop",
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    uploadsBucket.grantReadWrite(apiFn);
    uploadsBucket.grantRead(ingestFn);
    dbSecret.grantRead(apiFn);
    dbSecret.grantRead(ingestFn);

    //S3 event -> ingest lambda
    uploadsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(ingestFn),
      { prefix: "uploads/", suffix: ".csv" }
    );

    //http api + jwt authorizer
    const httpApi = new apigwv2.HttpApi(this, "MyDepopHttpApi");

    const jwtAuthorizer = new authorizers.HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    httpApi.addRoutes({
      path: "/presign",
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration("PresignIntegration", apiFn),
      authorizer: jwtAuthorizer,
    });

    httpApi.addRoutes({
      path: "/kpis",
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration("KpisIntegration", apiFn),
      authorizer: jwtAuthorizer,
    });

    //outputs
    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.url ?? "" });
    new cdk.CfnOutput(this, "UploadsBucketName", { value: uploadsBucket.bucketName });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
  }
}