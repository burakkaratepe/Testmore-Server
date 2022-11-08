require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require('cors');
require("./device");
require("./socket");

const User = require("./model/user");
const { verifyToken, isAuthenticated } = require("./middleware/auth");

const app = express();

app.use(express.json({ limit: "50mb" }));

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.listen(3000, () => {
  console.log("Server is listening 3000 port");
});

//app.use("/assets", express.static(path.resolve(__dirname, "frontend", "assets")));

app.use("/api/*", verifyToken, function (req, res, next) {
  console.log(`Incoming request to ${req.url} with ${JSON.stringify(req.body)}`);
  next();
  res.on('finish', async () => {
    console.log(`Responsed ${req.url} with ${JSON.stringify(req.body)}`);
  });
});

// app.get('/login.html', function (req, res) {
//   res.sendFile(path.resolve(__dirname, "frontend", "pages", "login.html"));
// });

app.get("/isAuthenticated", async (req, res) => {
  return await isAuthenticated(req, res);
});

app.get("/api/device/getDevices", async (req, res) => {
  require("./device")
    .getDevices()
    .then((devices) => {
      res.status(201).json(devices);
    });
});

app.post("/api/device/runTestOnMobileDevice", async (req, res) => {
  //TODO: startTestOnMobileDevice method will be written in to device class
  console.log("test run is starting for device has " + req.body.device.udid + " device");
  require("./device")
    .startTestOnMobileDevice(req.body.device)
    .then((testState) => {
      res.status(201).json(testState);
    })
    .catch((error) => {
      res.status(404).json(error);
    });
})

// app.get('/*', function (req, res) {
//   res.sendFile(path.resolve(__dirname, "frontend", "index.html"));
// });

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { first_name, last_name, email, password } = req.body;

    // Validate user input
    if (!(email && password && first_name && last_name)) {
      console.log(req.body);
      res.status(400).send("All input is required");
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      // user
      return res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;
