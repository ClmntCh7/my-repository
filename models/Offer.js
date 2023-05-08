const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  _id: String,
  product_name: {
    type: String,
    maxLength: 50,
  },
  product_description: {
    type: String,
    maxLength: 500,
  },
  product_price: {
    type: Number,
    max: 10000,
  },

  product_details: Array,

  product_image: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
