import * as Yup from 'yup';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import OrderMail from '../jobs/OrderMail';
import Queue from '../../lib/Queue';

class OrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      where: {
        canceled_at: null,
        start_date: null,
        end_date: null,
      },
      attributes: ['id', 'product'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zipcode',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'avatar_id', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { product, recipient_id, deliveryman_id } = req.body;

    const recipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient does not found' });
    }

    const deliveryman = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not found' });
    }

    const order = await Order.create({
      product,
      recipient_id,
      deliveryman_id,
    });

    await Queue.add(OrderMail.key, {
      deliveryman,
      product,
    });

    return res.json(order);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { recipient_id, deliveryman_id } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (recipient_id && recipient_id !== order.recipient_id) {
      const recipientExists = await Recipient.findOne({
        where: { id: recipient_id },
      });

      if (!recipientExists) {
        return res.status(400).json({ error: 'Recipient does not found' });
      }
    }

    if (deliveryman_id && deliveryman_id !== order.deliveryman_id) {
      const deliverymanExists = await Deliveryman.findOne({
        where: { id: deliveryman_id },
      });

      if (!deliverymanExists) {
        return res.status(400).json({ error: 'Deliveryman does not found' });
      }
    }

    const { product } = await order.update(req.body);

    return res.json({
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    await order.destroy();

    return res.json({ message: 'Deleted with success' });
  }
}

export default new OrderController();
