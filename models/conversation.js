// models/conversation.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      // a conversation belongs to a team
      Conversation.belongsTo(models.Team, { foreignKey: 'teamId' });

      // link users via the join table
      Conversation.belongsToMany(models.User, {
        through: models.ConversationParticipant,
        foreignKey: 'conversationId',
        as: 'Users'
      });

      // if you want, also:
      Conversation.hasMany(models.Message, { foreignKey: 'conversationId' });
      Conversation.hasMany(models.ConversationParticipant, { foreignKey: 'conversationId' });
    }
  }
  Conversation.init({
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    teamId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Conversation',
  });
  return Conversation;
};
