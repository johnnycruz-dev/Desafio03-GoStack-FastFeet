import * as Yup from 'yup';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Deliveryman from '../models/Deliveryman';

class DeliveryController {
  async index(req, res) {
    const { id } = req.params;
    const { page = 1 } = req.query;

    const deliveryman = await Deliveryman.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found' });
    }

    const orders = await Order.findAll({
      where: {
        deliveryman_id: id,
        end_date: { [Op.ne]: null },
      },
      order: ['end_date'],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      order_id: Yup.number().required(),
      signature_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { order_id, signature_id } = req.body;

    const order = await Order.findByPk(order_id);

    if (!order) {
      return res.status(401).json({ error: 'Order does not found' });
    }

    if (order.start_date === null) {
      return res
        .status(401)
        .json({ error: 'Order has not yet been withdrawn' });
    }

    if (order.end_date !== null) {
      return res.status(401).json({ error: 'Order already delivered' });
    }

    order.end_date = new Date();
    order.signature_id = signature_id;

    order.save();

    return res.json(order);
  }
}

export default new DeliveryController();
