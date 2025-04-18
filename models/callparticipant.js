'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CallParticipant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CallParticipant.init({
    callId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    joinTime: DataTypes.DATE,
    leaveTime: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'CallParticipant',
  });
  return CallParticipant;
};