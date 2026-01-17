import { CdklabsConstructLibrary, JsiiLanguage } from 'cdklabs-projen-project-types';
import { NodePackageManager, UpgradeDependenciesSchedule } from 'projen/lib/javascript';

const project = new CdklabsConstructLibrary({
  private: false,
  enablePRAutoMerge: true, // Use GitHub's native merge queue instead of Mergify
  projenrcTs: true,
  author: 'AWS',
  authorAddress: 'aws-cdk-dev@amazon.com',
  // we don't strictly guarantee it works in older CDK (integ-runner runs on newer CDK), but hopefully it should.
  cdkVersion: '2.38.0',
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
  ],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: UpgradeDependenciesSchedule.MONTHLY,
    },
  },
  description: 'Build during CDK deployment.',
  jsiiTargetLanguages: [JsiiLanguage.PYTHON, JsiiLanguage.JAVA],
});
project.eslint?.addRules({
  '@typescript-eslint/no-unused-vars': 'off',
});
// Bundle custom resource handler Lambda code
project.projectBuild.postCompileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
project.synth();
