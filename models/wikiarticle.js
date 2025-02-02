module.exports = (sequelize, DataTypes) => {
  const WikiArticle = sequelize.define("WikiArticle", {
    title: { type: DataTypes.STRING, allowNull: false },
    content: DataTypes.TEXT,
  });

  WikiArticle.associate = (models) => {
    WikiArticle.belongsTo(models.WikiCategory, { foreignKey: "categoryId", onDelete: "CASCADE" });
    WikiArticle.belongsTo(models.User, { foreignKey: "authorId", onDelete: "SET NULL" });
  };

  return WikiArticle;
};
