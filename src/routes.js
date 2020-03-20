import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';
import DeliverymanController from './app/controllers/DeliverymanController';
import SignatureController from './app/controllers/SignatureController';
import OrderController from './app/controllers/OrderController';
import WithdrawController from './app/controllers/WithdrawController';
import DeliveryController from './app/controllers/DeliveryController';
import ViewOrderController from './app/controllers/ViewOrderController';
import ProblemController from './app/controllers/ProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);
routes.post('/users', UserController.store);

routes.post('/deliveryman/:id/withdraw', WithdrawController.store);
routes.post('/deliveryman/:id/delivery', DeliveryController.store);
routes.get('/deliveryman/:id/deliveries', DeliveryController.index);
routes.get('/deliveryman/:id', ViewOrderController.index);

routes.get('/problem', ProblemController.index);
routes.delete('/problem/:id/cancel-delivery', ProblemController.delete);

routes.get('/delivery/:id/problems', ProblemController.show);
routes.post('/delivery/:id/problems', ProblemController.store);

routes.use(authMiddleware);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.post('/signatures', upload.single('file'), SignatureController.store);

routes.get('/deliverymans', DeliverymanController.index);
routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans/:id', DeliverymanController.update);
routes.delete('/deliverymans/:id', DeliverymanController.delete);

routes.get('/orders', OrderController.index);
routes.post('/orders', OrderController.store);
routes.put('/orders/:id', OrderController.update);
routes.delete('/orders/:id', OrderController.delete);

export default routes;
