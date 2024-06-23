const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router.route([ "/", "/home", "/folders"])
    .get(fileController.getAllFiles)
    .post(fileController.uploadFile)
    .delete(fileController.deleteFile);

router.route("/folders/:folderId")
    .get(fileController.getFolderFiles);

router.route("/:fileId")
    .get(fileController.getFile)
    .post(fileController.uploadFile);

module.exports = router;
