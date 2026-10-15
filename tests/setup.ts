import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

MotionGlobalConfig.skipAnimations = true; // animations add nothing to behaviour tests
configure({ asyncUtilTimeout: 5000 }); // findBy/waitFor budget for a busy machine or CI runner
if (typeof Element !== 'undefined') Element.prototype.scrollTo ??= () => {}; // jsdom has no layout; node tests have no DOM

afterEach(() => cleanup());
