import * as R1 from 'react';

const RAny = R1 as unknown as Record<string, unknown>;
console.log('R1 useState:', typeof RAny.useState);

// Force loading via specific path:
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoReactPath = path.resolve(__dirname, '../../demo-app/node_modules/react/index.js');
console.log('demo react path:', demoReactPath);

const R2 = await import(demoReactPath);
console.log('R1 === R2:', R1 === R2);
console.log('R1.useState === R2.useState:', R1.useState === R2.useState);

const internals1 = (R1 as unknown as Record<string, unknown>)['__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
const internals2 = (R2 as unknown as Record<string, unknown>)['__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'];
console.log('internals1 === internals2:', internals1 === internals2);
