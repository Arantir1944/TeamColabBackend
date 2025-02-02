module.exports = (sequelize, DataTypes) => {
  const WikiCategory = sequelize.define("WikiCategory", {
    name: { type: DataTypes.STRING, allowNull: false },
  });

  WikiCategory.associate = (models) => {
    WikiCategory.belongsTo(models.Team, { foreignKey: "teamId", onDelete: "CASCADE" });
    WikiCategory.hasMany(models.WikiArticle, { foreignKey: "categoryId", onDelete: "CASCADE" });
  };

  return WikiCategory;
};
