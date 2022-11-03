import React, { useCallback, useEffect, useState } from 'react';
import { Message } from '@wind/wind-ui';
import { commonServiceRequest, getSingleResult, request } from '../../../utils/request';
import JSZip from 'jszip';
import { a } from './example';
import RppToDelta from './rpp2Delta';
let reportParams;

/**
 * 报告模板转换
 * @param {String} content 
 * @returns {Promise}
 */
function transferToBlob(content, fileName) {
	const zip = new JSZip();
	zip.file(`${fileName}.txt`, content);
	return zip.generateAsync({type: 'blob'}).then(function(blob) {
		return {blob, name: `${fileName}.zip`};
	});
}

/**
 * 
 * @param {Object} blobObj 
 * @returns {Promise}
 */
export function save2Gfs(blobObj) {
	let formData = new FormData();
	formData.append("file", blobObj.blob, blobObj.name);
	formData.append("syc", true);

	return request.post(
		'/IBDServer/utils/multiuploadgfs',
		// '/IBDServer/utils/upload',
		formData, 
		{ 		
			headers: { 
			"content-type": "multipart/form-data"
			} 
		}
	)
	.then(function (response) {
		return response;
	})
	.catch(function (error) {
		console.log(error);
	});
}

/**
 * 
 * @param {String} dir 
 * @param {String} id 
 * @param {String} team_id 
 */
export function saveReportContent({
	dir, 
	id, 
	team_id, 
	out_user_id, 
	reportName, 
	report_type, 
	compressd_chart, 
	compressd_chart_url, 
	auto_save
}) {
	const paramsObj = {
		frame_id: reportParams.frame_id,
		report_name: reportName || reportParams.report_name,
		report_type: report_type || reportParams.report_type,
		researche_category_id: reportParams.researche_category_id,
		// compressd_chart: reportParams.compressd_chart,
		cutoff_date: reportParams.cutoff_date,
		wind_code: reportParams.wind_code,
		report_date: reportParams.report_date,
		report_status: reportParams.report_status,
		is_template: reportParams.is_template,
		id,
		team_id,
		compressd_chart,
		auto_save,
		// compressd_chart_url,
		// content: dir,
		compressd_chart_url: compressd_chart_url&&compressd_chart_url.length > 0 ? compressd_chart_url[0] : '',
		content: dir && dir.length > 0 ? dir[0] : '',
	}

	commonServiceRequest.post(
		'SearchResearcherInfo',
		[
				{
						name: 'RMSReport.GetStockResearch',
						data: {
								query: `report name=WorkBench.OperationReport type=1 Keys={\"data\":${JSON.stringify(paramsObj)}} out_user_id=${out_user_id} v=2`,
						},
				},
		],
	)
}

// function _saveReport({content, id, team_id, out_user_id, fileName, reportName, report_type, compressd_chart, compressd_chart_url}) {
function _saveReport({content, fileName, ...args}) {
	transferToBlob(JSON.stringify(content), fileName)
	.then(blobData => {
		save2Gfs(blobData)
		.then(reportDir => {
			saveReportContent({dir: reportDir, ...args});
		});
	});
}

function saveReportByNow(args) {
	let fileName = `${Math.floor(new Date().getHours() / 2) }_${args.team_id}_${args.id}`;
	_saveReport({...args, fileName});
};

function saveReportByToday(args) {
	let fileName = `${new Date().format('yyyy-MM-dd')}_${args.team_id}_${args.id}`;
	_saveReport({...args, fileName});
}

function saveReport(args) {
	saveReportByNow(args);
	saveReportByToday(args);
}

/**
 * 
 * @param {Obje} param0 
 * @returns {Promise} 
 */
function getReport({id, out_user_id}) {
	const paramsObj = {
		id,
	}

	return commonServiceRequest.post(
		'SearchResearcherInfo',
		[
				{
						name: 'RMSReport.GetStockResearch',
						data: {
								query: `report name=WorkBench.QueryReport type=2 Keys={\"data\":${JSON.stringify(paramsObj)}} out_user_id=${out_user_id} v=2`,
						},
				},
		],
	)
	.then(res => {
		let transformData = getSingleResult(res);
		if(transformData[0]) {
			reportParams = transformData[0];
			let contentDir = transformData[0].content;
			if(~contentDir.indexOf('.zip')) {
				return resolveReport(contentDir);
			}
		}
		return null;
	})
	.then(res => {
		return {
			reportInfo: reportParams,
			deltaStr: res
		}
	})
	.catch(err => {
		console.log("err", err);
	});
}

/**
 * 
 * @param {String} dir 
 * @returns {Promise}
 */
export function resolveReport(dir) {
	if(!dir.startsWith("/")) {
		dir = `/${dir}`
	}
	return request._get(`/IBDServer${dir}`, { responseType: 'blob' })
	.then(res => {
		let zip = new JSZip();
		return zip.loadAsync(res.data)
		.then(data => {
			let zipObj = Object.values(data.files)[0];
			return zipObj.async("string").then(res => {
				return res;
			});
		})
		.catch(err => {
			console.error(err);
		});
	});
}


export const useReportData = ({ID, windCode, reportDate, reportName, report_type, tempId, out_user_id, team_id, ...args}) => {
	const [report, setReportData] = useState({});
	useEffect(() => {
		if(ID) {
			getReport({id: (+args.new === 1 && +tempId !== 0) ? tempId : ID, out_user_id})
			.then(res => {
				let reportData = null, reportInfo = res.reportInfo;
				let deltaStr = res.deltaStr;
				if(+args.new === 1 && deltaStr) {
					deltaStr = deltaStr.replace(/(\d{6}|\d{4})\.(sh|sz|bj|hk)/gi, windCode).replace(/rptDate=.[^']*/gi, `rptDate=${reportDate}`);
					reportInfo.is_template = '0';
					reportParams.is_template = '0';
					reportParams.report_status = '1';
				}
				if(tempId === 'rpp') {
					let rppData = JSON.parse(a);
					RppToDelta.transferToDelta(rppData.data);
					reportData = {delta: RppToDelta.delta};
				} else if(deltaStr) {
					reportData = JSON.parse(deltaStr);
				}
				setReportData({reportData, reportInfo});
			})
		}
	}, []);

	return [report, saveReport];
};

export const useComponentData = (info) => {
	const [list, setList] = useState();
	const [staticInfo, setStaticInfo] = useState(info);
	let store_team_id = null;
	const operation = (method, {name, content = '', team_id, id}) => {
		if(team_id && store_team_id !== team_id) {
			store_team_id = team_id;
		}
		const common_order = (paramStr) =>{
			return `report name=WorkBench.OperationComponent type=1 Keys={'data':{${paramStr}}} out_user_id=${staticInfo.out_user_id} v=2`
		};

		const resolveContent = (content) =>{
			return content.replaceAll(" ", "0X20").replaceAll("\"", "\\\"");
		}

		let operationMehod = {
			list: `report name=WorkBench.QueryComponent type=1 Keys={'data':{'teamId':${store_team_id}}} out_user_id=${staticInfo.out_user_id} v=2`,
			add: common_order(`'component_name':"${name}",'component_team_id':${store_team_id},'component_content':"${resolveContent(content)}"`),
			del: common_order(`'component_id':${id}`),
			edit: common_order(`'component_id':${id},'component_name':${name},'component_team_id':${store_team_id},'component_content':${content}`)
		}
		return commonServiceRequest.post(
			'SearchResearcherInfo',
			[
					{
							name: 'RMSReport.GetStockResearch',
							data: {
									query: operationMehod[method],
							},
					},
			],
		)
		.then(res => {
			return getSingleResult(res);
		})
		.catch(err => {
			console.log("err", err);
		});
	}

	const getList = (team_id) => {
		operation('list', {team_id})
		.then(res => {
			setList(res);
		});
	}

	const add = (args) => {
		return operation('add', args)
		.then(res => {
			getList();
			Message.success('保存元件成功');
		});
	}

	const del = (id) => {
		return operation('del', {id})
		.then(res => {
			getList();
			Message.success('删除元件成功');
		});
	}

	const edit = (args) => {
		return operation('edit', args)
		.then(res => {
			console.log('编辑元件成功');
		});
	}

	return [list, {getList, add, del, edit}];
}

export const useReportAsTemplate = (userInfo) => {
	const [info, setInfo] = useState(userInfo);
	const [isTemplate, setTemplate] = useState(false);

	const operationReport = useCallback(({type, id}) => {
		return commonServiceRequest.post(
			'SearchResearcherInfo',
			[
					{
							name: 'RMSReport.GetStockResearch',
							data: {
									query: `report name=WorkBench.OperationReport type=${type} Keys={'data':{'id':${id}}} out_user_id=${info.out_user_id} v=2`,
							},
					},
			],
		)
		.then(res => {
			return getSingleResult(res);
		})
		.catch(err => {
			console.log("err", err);
		});
	}, []);

	const setAsTemplate = useCallback((id) => {
		operationReport({id, type: 5})
		.then(res => {
			if(!res.error_message) {
				setTemplate(true);
				console.log('设为模板成功！');
			}
		})
	}, []);

	const cancelAsTemplate = useCallback((id) => {
		operationReport({id, type: 6})
		.then(res => {
			if(!res.error_message) {
				setTemplate(false);
				console.log('取消模板成功！');
			}
		})
	}, []);

	return [isTemplate, setTemplate, setAsTemplate, cancelAsTemplate];
}