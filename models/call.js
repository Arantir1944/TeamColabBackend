// models/call.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Call extends Model {
    static associate(models) {
      // A call belongs to one conversation
      Call.belongsTo(models.Conversation, {
        foreignKey: 'conversationId'
      });
      // A call has many participants
      Call.hasMany(models.CallParticipant, {
        foreignKey: 'callId'
      });
    }
  }
  Call.init({
    conversationId: DataTypes.INTEGER,
    initiatorId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    type: DataTypes.STRING,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Call',
  });
  return Call;
};
