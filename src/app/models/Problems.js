import Sequelize, { Model } from 'sequelize';

class Problems extends Model {
  static init(sequelize) {
    super.init(
      {
        description: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Order, { foreignKey: 'delivery_id', as: 'order' });
  }
}

export default Problems;
