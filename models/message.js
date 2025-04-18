'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Define associations for Message
     */
    static associate(models) {
      // a message was sent by a user (sender)
      Message.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });

      // a message belongs to a conversation
      Message.belongsTo(models.Conversation, {
        foreignKey: 'conversationId'
      });
    }
  }

  Message.init({
    conversationId: DataTypes.INTEGER,
    senderId: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    type: DataTypes.STRING,
    fileUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Message',
  });

  return Message;
};