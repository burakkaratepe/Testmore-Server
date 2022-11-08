const jwt = require("jsonwebtoken");

const config = process.env;

function getToken(req) {
  return req.body.token || req.query.token || req.headers["x-access-token"];
}

const verifyToken = (req, res, next) => {
  if (req.url.includes("/api/")) {
    const token = getToken(req);
    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }
    try {
      const decoded = jwt.verify(token, config.TOKEN_KEY);
      req.user = decoded;
    } catch (err) {
      return res.status(401).send("Invalid Token");
    }
  }
  return next();
};

async function isAuthenticated(req, res) {
  const token = getToken(req);
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const User = require("./../model/user");
    let user = jwt.verify(token, config.TOKEN_KEY);
    console.log(user);
    const email = user.email;
    user = await User.findOne({ email });
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(401).send("Invalid Token");
  }
}

module.exports = { verifyToken, isAuthenticated };
