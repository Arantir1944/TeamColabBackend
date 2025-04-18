// models/callparticipant.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CallParticipant extends Model {
    static associate(models) {
      // Link each participant back to the User who joined
      CallParticipant.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      // And to the Call they joined
      CallParticipant.belongsTo(models.Call, {
        foreignKey: 'callId'
      });
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
