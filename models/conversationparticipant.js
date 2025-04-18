// models/conversationparticipant.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationParticipant extends Model {
    static associate(models) {
      ConversationParticipant.belongsTo(models.User, { foreignKey: 'userId' });
      ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
    }
  }
  ConversationParticipant.init({
    conversationId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    lastRead: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ConversationParticipant',
  });
  return ConversationParticipant;
};
