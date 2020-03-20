import * as Yup from 'yup';
import Order from '../models/Order';
import Problems from '../models/Problems';
import Deliveryman from '../models/Deliveryman';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class ProblemController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const problem = await Problems.findAll({
      attributes: ['id', 'description'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          where: { canceled_at: null },
          model: Order,
          as: 'order',
          attributes: ['product'],
        },
      ],
    });

    if (!problem) {
      return res.status(400).json({ error: 'No problem delivery' });
    }

    return res.json(problem);
  }

  async show(req, res) {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(401).json({ error: 'Order does not found' });
    }

    const problem = await Problems.findOne({
      where: {
        delivery_id: id,
      },
      attributes: ['id', 'description'],
      include: [
        {
          where: { canceled_at: null },
          model: Order,
          as: 'order',
          attributes: ['product'],
        },
      ],
    });

    if (!problem) {
      return res.status(400).json({ error: 'This order had no problem' });
    }

    return res.json(problem);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const { description } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(401).json({ error: 'Order does not found' });
    }

    if (order.end_date !== null) {
      return res
        .status(400)
        .json({ error: 'Order has already been delivered' });
    }

    const problem = await Problems.create({
      delivery_id: order.id,
      description,
    });

    return res.json(problem);
  }

  async delete(req, res) {
    const problem = await Problems.findByPk(req.params.id);

    const order = await Order.findByPk(problem.delivery_id);

    const deliveryman = await Deliveryman.findByPk(order.deliveryman_id);

    order.canceled_at = new Date();

    await order.save();

    await Queue.add(CancellationMail.key, {
      deliveryman,
      product: order.product,
      problem: problem.description,
    });

    return res.json({ message: 'Cancellation completed' });
  }
}

export default new ProblemController();
