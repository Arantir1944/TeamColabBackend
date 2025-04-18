// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM("Manager", "Team Leader", "Employee"),
      defaultValue: "Employee"
    },
  });

  User.associate = (models) => {
    // existing:
    User.belongsTo(models.Team, { foreignKey: "teamId", onDelete: "CASCADE" });

    // **new**: conversations
    User.belongsToMany(models.Conversation, {
      through: models.ConversationParticipant,
      foreignKey: 'userId',
      as: 'Conversations'
    });

    // optional: messages
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'SentMessages' });
  };

  return User;
};
