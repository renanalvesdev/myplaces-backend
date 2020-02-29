const express = require("express");
const bodyParser = require("body-parser");
const HttpError = require("./models/http-error");
const placesRoutes = require("./routes/places-routes");

const app = express();

//captura o json numa requisicao e chama o next
app.use(bodyParser.json());

app.use("/api/places", placesRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Rota nao encontrada", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred !" });
});

app.listen(5000);
