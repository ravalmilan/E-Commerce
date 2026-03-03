const Category = require("../models/category-model");

// GET all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Invalid category name" });
    }

    // check if exists
    const existing = await Category.findOne({
      name: name.trim(),
    });

    if (existing) {
      return res.json(existing);
    }

    const newCategory = await Category.create({
      name: name.trim(),
    });

    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
