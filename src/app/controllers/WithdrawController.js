import * as Yup from 'yup';
import {
  isBefore,
  isAfter,
  setSeconds,
  setMinutes,
  setHours,
  startOfHour,
  startOfDay,
} from 'date-fns';
import Order from '../models/Order';
import Deliveryman from '../models/Deliveryman';

class WithdrawController {
  async store(req, res) {
    const schema = Yup.object().shape({
      order_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found' });
    }

    if (deliveryman.count === 0) {
      return res.status(401).json({ error: 'Limit of 5 withdrawals per day' });
    }

    const startWithdraw = startOfHour(
      setSeconds(setMinutes(setHours(new Date(), 8), 0), 0)
    );

    const endWithdraw = startOfHour(
      setSeconds(setMinutes(setHours(new Date(), 18), 0), 0)
    );

    if (
      isBefore(endWithdraw, new Date()) ||
      isAfter(startWithdraw, new Date())
    ) {
      return res.status(401).json({
        error: 'Withdrawals can only be made between 08:00 and 18:00.',
      });
    }

    const { order_id } = req.body;

    const order = await Order.findByPk(order_id);

    if (!order) {
      return res.status(401).json({ error: 'Order does not found' });
    }

    if (order.start_date !== null) {
      return res
        .status(401)
        .json({ error: 'Order has already been withdrawn' });
    }

    const newDate = startOfDay(
      setSeconds(setMinutes(setHours(new Date(), 0), 0), 0)
    );
    const oldDate = startOfDay(
      setSeconds(setMinutes(setHours(deliveryman.last_withdrawal, 0), 0), 0)
    );

    if (isBefore(newDate, oldDate)) {
      deliveryman.count = 5;
    }

    order.start_date = new Date();

    deliveryman.count -= 1;
    deliveryman.last_withdrawal = new Date();

    await order.save();
    await deliveryman.save();

    return res.json(deliveryman);
  }
}

export default new WithdrawController();
