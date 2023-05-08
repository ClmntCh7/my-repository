const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");

// GET offers by Id
router.get("/offer/:id", async (req, res) => {
  try {
    const params = req.params;
    const { id } = params;
    console.log(params);
    console.log(req.user._id);

    // const findOfferById = await Offer.findById(id).populate({
    //   path: "owner",
    //   select: "account",
    // });
    const findOfferById = await Offer.findById(id).populate("owner", "account");

    res.status(200).json({ message: findOfferById });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET searched offers
router.get("/offers", async (req, res) => {
  try {
    const query = req.query;
    const { title, priceMin, priceMax, sort, page } = query;
    console.log(query);

    //Sort function
    const setSortObj = (sortValue) => {
      if (sort === "price-desc") {
        sortValue = -1;
        const sortObj = { product_price: sortValue };
        return sortObj;
      } else if (sort === "price-asc") {
        sortValue = 1;
        const sortObj = { product_price: sortValue };
        return sortObj;
      } else {
        return null;
      }
    };
    // console.log("SORT", setSortObj(sort));

    //Filter function
    const setfilters = (queryParams) => {
      const filters = {};
      if (title) {
        filters.product_name = new RegExp([title], "i");
      }
      if (priceMin) {
        filters.product_price = { $gte: priceMin };
      }
      if (priceMax) {
        if (filters.product_price) {
          filters.product_price.$lte = priceMax;
        } else {
          filters.product_price = { $lte: priceMax };
        }
      }
      // console.log("FILTERS", filters);

      return filters;
    };

    const resultToReturn = 20;

    const findOffers = await Offer.find(setfilters(query))
      .skip(page ? (page - 1) * resultToReturn : null)
      .limit(resultToReturn)
      .sort(setSortObj(sort))
      .populate("owner", "account");
    // .select("_id, product_price");

    const count = Object.keys(findOffers).length;

    const formatedResp = {
      count: count,
      offers: findOffers,
    };

    res.status(200).json({ message: formatedResp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const convertToBase64 = (file) => {
  console.log("ICI", file);
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// POST an offer
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const files = req.files.product_image;
      console.log(files);
      const user = req.user;
      const {
        account: {
          username,
          avatar: { secure_url },
        },
        _id,
      } = user;

      const body = req.body;
      const {
        product_name,
        product_description,
        product_price,
        brand,
        size,
        condition,
        color,
        city_location,
      } = body;

      const newOffer = new Offer({
        product_name: product_name,
        product_description: product_description,
        product_price: product_price,
        product_details: [
          { brand: brand },
          { size: size },
          { condition: condition },
          { color: color },
          { city_location: city_location },
        ],
        owner: user,
      });

      const arrayOfPictures = files.map((file) => {
        return cloudinary.uploader.upload(convertToBase64(file), {
          folder: "vinted/offers",
          display_name: newOffer._id,
        });
      });

      const uploadPictures = await Promise.all(arrayOfPictures);
      console.log(uploadPictures);

      newOffer.product_image = uploadPictures;

      await newOffer.save();

      res.status(200).json({ message: newOffer });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
