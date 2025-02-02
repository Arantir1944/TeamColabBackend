module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define("Task", {
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("To Do", "In Progress", "Done"),
      defaultValue: "To Do"
    },
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Board, { foreignKey: "boardId", onDelete: "CASCADE" });
    Task.belongsTo(models.User, { foreignKey: "assignedTo", onDelete: "SET NULL" });
  };

  return Task;
};
