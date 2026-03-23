import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { productsHandlers } from './handlers/products.handlers';

export const server = setupServer(...authHandlers, ...productsHandlers);
