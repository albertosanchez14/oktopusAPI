const express = require("express");

const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/loginLimiter");

const router = express.Router();

router.route("/")
  .post(loginLimiter, authController.login);

router.route("/refresh")
  .get(authController.refresh);

router.route("/logout")
  .post(authController.logout);

router.route("/google")
  .get(authController.googleLogin);

router.route("/google/redirect")
  .get(authController.googleRedirect);

module.exports = router;
