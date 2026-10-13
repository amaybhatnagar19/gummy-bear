export function parseEnvironment(text: string): Record<string, string>;
export function validateTestingEnvironment(env: Record<string, string | undefined>): Record<string, string>;
export function readTestingEnvironment(): Record<string, string>;
export function testingProcessEnvironment(parent: Record<string, string | undefined>, env: Record<string, string>): Record<string, string | undefined>;
export function verifyRemoteTestingProject(): Promise<Record<string, string>>;
export function validateTestingCommand(args: string[]): 'verify' | 'push';
export function prepareTestingWorkspace(env: Record<string, string>): Promise<string>;
