module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('deliverymans', 'count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('deliverymans', 'count');
  },
};
