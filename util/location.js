const Axios = require("axios");
const HttpError = require("../models/http-error");

const API_KEY = "AIzaSyDbXpr77DwdRRfV1njfbylsAZF_xqGWNNw";

async function getCoordsForAddress(address) {
  const response = await Axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;
  console.log(data);
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location to specified address.",
      422
    );
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
