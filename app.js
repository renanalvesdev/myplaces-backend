const express = require("express");
const bodyParser = require("body-parser");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const app = express();

//captura o json numa requisicao e chama o next
app.use(bodyParser.json());

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

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

mongoose
  .connect(
    "mongodb://localhost:27017,localhost:27018,localhost:27019/my_places?replicaSet=rs"
  )
  .then(() => {
    app.listen(5000);
  })
  .catch(err => {
    console.log(error);
  });
