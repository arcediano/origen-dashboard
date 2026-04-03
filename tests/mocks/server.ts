import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { productsHandlers } from './handlers/products.handlers';
import { notificationsHandlers } from './handlers/notifications.handlers';
import { ordersHandlers } from './handlers/orders.handlers';
import { producersHandlers } from './handlers/producers.handlers';

export const server = setupServer(
  ...authHandlers,
  ...productsHandlers,
  ...notificationsHandlers,
  ...ordersHandlers,
  ...producersHandlers,
);
