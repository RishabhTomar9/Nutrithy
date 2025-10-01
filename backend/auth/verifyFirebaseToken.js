const admin = require("../firebaseAdmin");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized");
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error", error);
    res.status(403).send("Invalid token");
  }
};
