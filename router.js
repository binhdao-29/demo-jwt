import { Router } from 'express';
import { getProfileController, loginController } from './controller.js';

const router = Router();

router.post('/login', async (req, res) => {
  const resData = await loginController(req);
  res.status(resData.status).send(resData.response);
})

router.get('/profile', async (req, res) => {
  const resData = await getProfileController(req);
  res.status(resData.status).send(resData.response);
})

export default router;