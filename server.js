const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ObjectId = mongoose.Types.ObjectId;
const path = require("path");
const app = express();
app.set("view-engine", "ejs");
mongoose.connect("mongodb://127.0.0.1/FileSystem", {
	useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error"));
db.once("open", () => {
	console.log("Connected");
});
const filesys = {
	"/User": {
		dirs: ["/Media", "/Docs", "/Code"],
		files: ["abc.pdf"],
		pwd: "/User",
	},
	"/User/Media": { files: "random.txt", pwd: "/User/Media" },
	"/User/Docs": { files: "doc.pdf", pwd: "/User/Docs" },
	"/User/Code": { files: "hello.cpp", pwd: "/User/Code" },
};
const rootID = "6295a9723526db756e30966e";

const folderSchema = new mongoose.Schema(
	{
		files: {
			type: Array,
		},
		folders: {
			type: Array,
		},
		parent: {
			type: Object,
		},
		pwd: {
			type: String,
		},
	},
	{ collection: "folders" }
);
const folderModel = mongoose.model("Folder", folderSchema, "folders");

app.use("/static", express.static(path.resolve("./staticfiles")));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
	res.render(path.resolve("./public/fstest.ejs"), { path: filesys["/User"] });
});
app.post("/createfolder", async (req, res) => {
	const { pwd, parid } = req.body;
	// console.log(parent, pwd);
	const parentId = await folderModel.findById(parid).select("_id pwd");
	const parentObj = {
		parentName: parentId.pwd,
		parentId: parentId._id,
	};
	// res.json(parentObj);
	const folder = await folderModel.findOne({
		"parent.parentId": ObjectId(parid),
		pwd: pwd,
	});
	// res.json({ folders: folder, id: parentId });
	if (folder == null) {
		folderModel.create({ parent: parentObj, pwd: pwd, folders: [], files: [] });
		res.json({ msg: "Created a new folder" });
	} else {
		res.json({ err: `Folder ${pwd.slice(1)} already exists!` });
	}
});
app.get("/folders/:folder", async (req, res) => {
	const { folder } = req.params;
	if (mongoose.isObjectIdOrHexString(folder) && folder != rootID) {
		const folds = await folderModel
			.find({
				$or: [
					{ _id: ObjectId(folder) },
					{ "parent.parentId": ObjectId(folder) },
				],
			})
			.select("_id pwd parent");
		res.render(path.resolve("./public/folderview.ejs"), {
			parentid: folds[0].parent.parentId,
			folders: folds.slice(1),
			parname: folds[0].pwd,
		});
	} else {
		res.status(404).sendFile(path.resolve("./public/404.html"));
	}
});
app.get("*", (req, res) => {
	res.status(404).sendFile(path.resolve("./public/404.html"));
});
app.listen(5000, () => {
	console.log("Server running on port 5000");
});
