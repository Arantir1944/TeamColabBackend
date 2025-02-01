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
    User.belongsTo(models.Team, { foreignKey: "teamId", onDelete: "CASCADE" });
  };

  return User;
};
