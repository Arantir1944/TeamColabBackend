module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define("Board", {
    name: { type: DataTypes.STRING, allowNull: false },
  });

  Board.associate = (models) => {
    Board.belongsTo(models.Team, { foreignKey: "teamId", onDelete: "CASCADE" });
    Board.hasMany(models.Task, { foreignKey: "boardId", onDelete: "CASCADE" });
  };

  return Board;
};
