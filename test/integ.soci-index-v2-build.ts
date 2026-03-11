import { join } from 'path';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { LinuxBuildImage, ComputeType } from 'aws-cdk-lib/aws-codebuild';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { SociIndexV2Build } from '../src';
import { getCrHandlerHash } from './util';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // make sure we can build more than one indices.
    {
      const parent = new Construct(this, 'Image1');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: join(__dirname, '../example/example-image'),
        buildArgs: { DUMMY_FILE_SIZE_MB: '11', HASH: getCrHandlerHash() },
      });
      new SociIndexV2Build(parent, 'Index', {
        inputImageTag: asset.assetHash,
        outputImageTag: `${asset.assetHash}-soci`,
        repository: asset.repository,
      });
    }

    {
      const parent = new Construct(this, 'Image2');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: join(__dirname, '../example/example-image'),
        buildArgs: { DUMMY_FILE_SIZE_MB: '50' },
      });
      SociIndexV2Build.fromDockerImageAsset(parent, 'Index', asset);
    }

    // Test custom build environment
    {
      const parent = new Construct(this, 'ImageCustomEnv');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: join(__dirname, '../example/example-image'),
        buildArgs: { DUMMY_FILE_SIZE_MB: '20' },
      });
      new SociIndexV2Build(parent, 'Index', {
        inputImageTag: asset.assetHash,
        outputImageTag: `${asset.assetHash}-soci-env`,
        repository: asset.repository,
        environment: {
          buildImage: LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:7.0'),
          computeType: ComputeType.SMALL,
          privileged: true,
          environmentVariables: {
            HELLO: { value: 'WORLD' },
          },
        },
      });
    }

    // Test fromDockerImageAsset with environment
    {
      const parent = new Construct(this, 'ImageFromAssetAndEnv');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: join(__dirname, '../example/example-image'),
        buildArgs: { DUMMY_FILE_SIZE_MB: '21' },
      });
      SociIndexV2Build.fromDockerImageAsset(parent, 'Index', asset, {
        buildImage: LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:7.0'),
        computeType: ComputeType.LARGE,
        privileged: false,
      });
    }
  }
}

const stack = new TestStack(app, 'SociIndexBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});