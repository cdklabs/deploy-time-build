import { CdklabsConstructLibrary, JsiiLanguage } from 'cdklabs-projen-project-types';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { NodePackageManager, UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { ReleasableCommits } from 'projen/lib/version';

const minCdkVersion = '2.38.0';
const minConstructsVersion = '10.0.5';

const project = new CdklabsConstructLibrary({
  private: false,
  enablePRAutoMerge: true, // Use GitHub's native merge queue instead of Mergify
  projenrcTs: true,
  author: 'AWS',
  authorAddress: 'aws-cdk-dev@amazon.com',
  // we don't strictly guarantee it works in older CDK (integ-runner runs on newer CDK), but hopefully it should.
  cdkVersion: minCdkVersion,
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: '@cdklabs/deploy-time-build',
  repositoryUrl: 'https://github.com/cdklabs/deploy-time-build.git',
  packageManager: NodePackageManager.NPM,
  workflowNodeVersion: '24',
  jestOptions: {
    jestVersion: '^29',
  },
  eslintOptions: {
    dirs: [],
    ignorePatterns: ['example/**/*', 'lambda/**/*', 'test/assets/**/*', 'test/*.snapshot/**/*', '*.d.ts'],
  },
  gitignore: ['*.js', '*.d.ts', '!test/*.snapshot/**/*'],
  npmIgnoreOptions: {
    ignorePatterns: ['lambda/trigger-codebuild/package-lock.json', 'imgs', 'example'],
  },
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
  devDeps: ['cdklabs-projen-project-types', 'aws-cdk-lib@^2.159.0', 'aws-cdk@^2.159.0', 'constructs'],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: UpgradeDependenciesSchedule.MONTHLY,
    },
  },
  releasableCommits: ReleasableCommits.everyCommit(),
  description: 'Run build on CDK deployment time.',
  jsiiTargetLanguages: [JsiiLanguage.PYTHON],
});
project.eslint?.addRules({
  '@typescript-eslint/no-unused-vars': 'off',
});
// Bundle custom resource handler Lambda code
project.projectBuild.postCompileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
// Verify minimum CDK version compatibility
project.buildWorkflow?.addPostBuildJob('verify-min-cdk-version', {
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.READ,
  },
  steps: [
    {
      name: 'Checkout',
      uses: 'actions/checkout@v4',
      with: {
        ref: '${{ github.event.pull_request.head.ref }}',
        repository: '${{ github.event.pull_request.head.repo.full_name }}',
      },
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': '24',
      },
    },
    {
      name: 'Install dependencies',
      run: 'npm ci',
    },
    {
      name: 'Build Lambda handler',
      run: 'npm ci && npm run build',
      workingDirectory: 'lambda/trigger-codebuild',
    },
    {
      name: 'Verify minimum CDK version compatibility',
      run: `./scripts/verify-min-cdk.sh ${minCdkVersion} ${minConstructsVersion}`,
    },
  ],
});

project.synth();
