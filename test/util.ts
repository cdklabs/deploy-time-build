import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, Validations } from 'aws-cdk-lib';

/**
 * integ-test runs update stack with the latest template, but
 * it does not trigger custom resource handler when there is
 * no change on custom resource properties.
 *
 * To enforce re-running the handler, we include the hash of
 * custom resource handler code in the properties.
 */
export const getCrHandlerHash = () => {
  const handlerFile = readFileSync(join(__dirname, '..', 'lambda', 'trigger-codebuild', 'dist', 'index.js')).toString();
  return createHash('md5').update(handlerFile).digest('hex');
};

/**
 * These integ tests have no assertions, so IntegTest's DeployAssert stack
 * synthesizes with an empty Resources section, which the synth-time
 * CloudFormation validation rejects (F0001). Acknowledge it on that stack only.
 */
export const acknowledgeEmptyDeployAssert = (integ: IntegTest) => {
  // DeployAssert exposes the stack it synthesizes into as `scope`.
  const deployAssertStack = (integ.assertions as unknown as { scope: Stack }).scope;
  Validations.of(deployAssertStack).acknowledge({
    id: 'CloudFormation-Validate::F0001',
    reason: 'DeployAssert stack is empty because these integ tests have no assertions',
  });
};
