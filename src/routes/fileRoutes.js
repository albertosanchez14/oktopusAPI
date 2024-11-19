const express = require("express");

const fileController = require("../controllers/fileController");
const { verifyJWT } = require("../middleware/verifyJWT");
const { upload } = require("../config/storageOptions");

const router = express.Router();

router.use(verifyJWT);

router.route([ "/", "/home", "/folders"])
    .get(fileController.getAllFiles)
    .delete(fileController.deleteFile);

router.route("/folders/:folderId")
    .get(fileController.getFolderFiles)
    .post(upload.any(), fileController.uploadFile);

router.route("/folders/:folderId/:fileId")
    .get(fileController.getFile);

router.route("/:fileId")
    .get(fileController.getFile)

module.exports = router;
