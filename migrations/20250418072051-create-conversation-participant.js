'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConversationParticipants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      conversationId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastRead: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create a unique constraint to prevent duplicate participants
    await queryInterface.addConstraint('ConversationParticipants', {
      fields: ['conversationId', 'userId'],
      type: 'unique',
      name: 'unique_conversation_participant'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ConversationParticipants');
  }
};