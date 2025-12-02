import { CdklabsConstructLibrary } from 'cdklabs-projen-project-types';
import { NodePackageManager } from 'projen/lib/javascript';

const project = new CdklabsConstructLibrary({
  projenrcTs: true,
  author: 'AWS',
  authorAddress: 'aws-cdk-dev@amazon.com',
  // we don't strictly guarantee it works in older CDK (integ-runner runs on newer CDK), but hopefully it should.
  cdkVersion: '2.69.0', // C# build fails before this version
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: '@cdklabs/deploy-time-build',
  repositoryUrl: 'https://github.com/cdklabs/deploy-time-build.git',
  packageManager: NodePackageManager.NPM,
  workflowNodeVersion: '24',
  eslintOptions: {
    dirs: [],
    ignorePatterns: ['example/**/*', 'lambda/**/*', 'test/assets/**/*', 'test/*.snapshot/**/*', '*.d.ts'],
  },
  gitignore: ['*.js', '*.d.ts', '!test/*.snapshot/**/*'],
  keywords: ['aws', 'cdk', 'lambda', 'aws-cdk', 'ecr', 'ecs'],
  tsconfigDev: {
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
    exclude: ['example', 'test/*.snapshot'],
  },
  tsconfig: {
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
  },
  devDeps: [
    'cdklabs-projen-project-types',
    'aws-cdk-lib@^2.159.0',
    'aws-cdk@^2.159.0',
    'constructs',
    '@aws-cdk/integ-runner@^2.159.0-alpha.0',
    '@aws-cdk/integ-tests-alpha@^2.159.0-alpha.0',
  ],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
  upgradeRuntimeDepsAsFix: false,
  description: 'Build during CDK deployment.',
});
project.eslint?.addRules({
  '@typescript-eslint/no-unused-vars': 'off',
});
// Bundle custom resource handler Lambda code
project.projectBuild.postCompileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
project.synth();
