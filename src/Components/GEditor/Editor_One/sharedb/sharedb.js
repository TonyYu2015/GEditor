import ReconnectingWebSocket from "reconnecting-websocket";
import sharedb, { Connection } from "sharedb/lib/client";
import richText from "rich-text";
import * as json1 from "ot-json1";
import Quill from "quill";
import CollborateStruc from "./collaborateStructure";
import CONFIG from "./constants";

let Delta = Quill.import('delta');
json1.type.registerSubtype(richText);
sharedb.types.register(json1.type);

export default class ShareDBConnection {

	constructor(report, option) {
		this.report = report;
		this.quill = report.quill;
		this.timeStamp = new Date().getTime();
		this.startSub(option);
	}
	startSub(option) {
		const socket = new ReconnectingWebSocket(`${CONFIG.PROTOCOL}://${CONFIG.HOST}:${CONFIG.PORT}`);
		this.connection = new Connection(socket);
		this.doc = this.connection.get("examples", option.ID);
		const quill = this.quill;

		this.doc.subscribe(err => {
			if (err) return console.error("SUBSCRIBE_ERROR", err);

			if (option.new == 1) {
				if (option.tempId != 0) {
					this.createDocWithTemplate(option);
				} else {
					this.createDoc();
				}
			} else {
				this.renderDoc(this.doc.data);
			}

			quill.on("structure-change", change => {
				console.log("====>>>>>changeeee<<<<<<<<<<<<<<<<<<==============================", change);
				let [ composeOperations, delta, nest ] = this.collaborateStructure.transformToOperation(change);
				quill.emitter.emit("structure-operation", null, delta, nest);
				this.doc.submitOp(
					composeOperations,
					{
						source: {
							user_id: option.userInfo.out_user_id,
							timeStamp: this.timeStamp
						},
					}
				);
			});

			this.doc.on("op", (op, source) => {
				// if (source.user_id == option.userInfo.out_user_id) return;
				if (source.timeStamp == this.timeStamp) return;
				console.log("====>>>>oppp", op, source, option);
				let [operation, delta, nest] = this.collaborateStructure.AfterApplyOperation(op);
				quill.emitter.emit("structure-operation", operation, delta, nest);
			});
		});
	}

	close() {
		this.connection.close();
	}

	/**
	 * 创建报告
	 */
	createDoc() {
		this.report.addNewPage();
		let delta = this.quill.getContents();
		this.collaborateStructure = new CollborateStruc(delta, this.quill.NestContainerManager.NestContainer, true);
		this.doc.create(this.collaborateStructure.data, json1.type.uri);
	}

	/**
	 * 渲染报告
	 */
	renderDoc(data) {
		this.collaborateStructure = new CollborateStruc(data);
		const [delta, nestContainer] = this.collaborateStructure.seperate();
		this.report.renderReport({ newDelta: delta, nestContainer });
	}

	/**
	 * 根据模板新建一篇报告
	 */
	createDocWithTemplate(option) {
		const {
			windCode,
			reportDate
		} = option;
		this.connection.fetchSnapshot("examples", option.tempId, (err, snapshot) => {
			let templateData = snapshot.data;
			let templateDelta = templateData[0];
			let templateDeltaStr = JSON.stringify(templateDelta).replace(/(\d{6}|\d{4})\.(sh|sz|bj|hk)/gi, windCode).replace(/rptDate=.[^']*/gi, `rptDate=${reportDate}`);
			templateDelta = JSON.parse(templateDeltaStr);
			this.renderDoc(templateDelta);
			this.doc.create([new Delta(templateDelta), templateData[1]], json1.type.uri);
		});
	}

	/**
	 * 删除一篇报告
	 */
	deleteDoc() {
		this.doc.del();
	}


}