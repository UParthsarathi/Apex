import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

MotionGlobalConfig.skipAnimations = true; // animations add nothing to behaviour tests
Element.prototype.scrollTo ??= () => {}; // jsdom has no layout, so no scrolling

afterEach(() => cleanup());
