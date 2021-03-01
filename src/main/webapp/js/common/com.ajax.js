function jsAjaxCall(ajaxType, url, formId, callbackFunc, callbackFailFunc) {
	jsAjaxCallAsync(ajaxType, url, formId, false, callbackFunc, callbackFailFunc);
}

function jsAjaxCallAsync(ajaxType, url, formId, async, callbackFunc, callbackFailFunc) {
	var formData = formId != null ? $("#" + formId).serialize() : "";
	jsAjaxCallBase(ajaxType, url, formData, async, callbackFunc, callbackFailFunc);
}

function jsAjaxGet(url, data, callbackFunc, callbackFailFunc){
	jsAjaxCallBase("GET", url, data, true, callbackFunc, callbackFailFunc);
} 

function jsAjaxSyncPost(url, data, callbackFunc, callbackFailFunc){
	jsAjaxCallBase("POST", url, data, false, callbackFunc, callbackFailFunc);
}

function jsAjaxPost(url, data, callbackFunc, callbackFailFunc){
	jsAjaxCallBase("POST", url, data, true, callbackFunc, callbackFailFunc);
}

function jsAjaxPostEx(url, data, callbackFunc, callbackFailFunc){
	jsAjaxCallBaseEx("POST", url, data, true, false, callbackFunc, callbackFailFunc);
}

function jsAjaxCallBase(ajaxType, url, data, async, callbackFunc, callbackFailFunc) {
	$.ajax({
		type: ajaxType,
		async: async,
		url: url,
		data: data,
		dataType: "json",
		contentType: (ajaxType.toUpperCase() == "POST" ? "application/x-www-form-urlencoded; charset=UTF-8" : "application/json;charset=utf-8"),
		cache: false, 
		beforeSend : function(xhr, setting) {
        	if ( setting && setting.async == true ) {
	        	//showOverlayUi();
	        }
	    },
		success: function(response, textStatus, jqXHR) {
			//console.log("ajax result : success - " + response.result);
			$("#overlayDiv").hide();	// TODO

			if (response.result != "error") {	// response.result : success, fail, error
				if (callbackFunc) {
					eval(response);
					callbackFunc(response, jqXHR);
				} else {
					// do nothing
				}
			} else {
				if (callbackFailFunc) {
					eval(response);
					callbackFailFunc(response, jqXHR);
				} else {
					handleErrorStatus(jqXHR);
				}
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			var errorMsg = 'status(code): ' + jqXHR.status + '\n';
	        errorMsg += 'statusText: ' + jqXHR.statusText + '\n';
	        errorMsg += 'responseText: ' + jqXHR.responseText + '\n';
	        errorMsg += 'textStatus: ' + textStatus + '\n';
	        errorMsg += 'errorThrown: ' + errorThrown;
	        console.log(errorMsg);
			$("#overlayDiv").hide();	// TODO

			if (callbackFailFunc) {
				//eval(response);
				//callbackFailFunc(response, jqXHR);
				callbackFailFunc(jqXHR);
			} else {
				handleErrorStatus(jqXHR);
			}
		} 
	});
}

function jsAjaxCallBaseEx(ajaxType, url, data, async, isForm, callbackFunc, callbackFailFunc) {
	$.ajax({
		type: ajaxType,
		async: async,
		url: url,
		data: data,
		dataType: "json",
		contentType: (isForm == true ? "application/x-www-form-urlencoded; charset=UTF-8" : "application/json;charset=utf-8"),
		cache: false, 
		beforeSend : function(xhr, setting) {
        	if ( setting && setting.async == true ) {
	        	//showOverlayUi();
	        }
	    },
		success: function(response, textStatus, jqXHR) {
			//console.log("ajax result : success - " + response.result);
			$("#overlayDiv").hide();	// TODO

			if (response.result != "error") {	// response.result : success, fail, error
				if (callbackFunc) {
					eval(response);
					callbackFunc(response, jqXHR);
				} else {
					// do nothing
				}
			} else {
				if (callbackFailFunc) {
					eval(response);
					callbackFailFunc(response, jqXHR);
				} else {
					handleErrorStatus(jqXHR);
				}
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			var errorMsg = 'status(code): ' + jqXHR.status + '\n';
	        errorMsg += 'statusText: ' + jqXHR.statusText + '\n';
	        errorMsg += 'responseText: ' + jqXHR.responseText + '\n';
	        errorMsg += 'textStatus: ' + textStatus + '\n';
	        errorMsg += 'errorThrown: ' + errorThrown;
	        console.log(errorMsg);
			$("#overlayDiv").hide();	// TODO

			if (callbackFailFunc) {
				eval(response);
				callbackFailFunc(response, jqXHR);
			} else {
				handleErrorStatus(jqXHR);
			}
		} 
	});
}

// TODO
function handleErrorStatus(jqXHR) {
	//console.log(jqXHR.responseText);
	if (jqXHR.responseText && jqXHR.responseText.indexOf("[UNAUTHORIZED]") != -1) {
		alert("시스템에서 자동 로그아웃 처리되었습니다.\n시스템을 계속 이용하시려면 다시 로그인하십시오.");
		jsGoLoginPage();
	} else {
		var statusCode = 0;
		try {
			//statusCode = response.data.statusCode;
			statusCode = jqXHR.status;
			
		} catch(e) {}
		if (statusCode == 407) {	// 407:"Could not find the user"
			alert("시스템에서 자동 로그아웃 처리되었습니다.\n시스템을 계속 이용하시려면 다시 로그인하십시오.");
			jsGoLoginPage();
			return;
		}else if (statusCode == 400) {	// 400:"Bad Request"
			alert("잘못된 요청입니다.");
			return;
		}else if (statusCode == 404) {	// 404:"Not Found"
			alert("요청을 찾을 수 없습니다");
			return;
		}else if (statusCode == 500) {	// 500:"Internal Server Error"
			alert("서버 내부 오류 입니다.");
			return;
		}
		else {
			//TODO
			/*
			if (_blocked) {
				jsShowMsgInPopup(_err_com_0001);
			} else {
				jsShowMsg(_err_com_0001);
			}
			*/
			
		}
	}
} 

function jsParamAjaxCall(ajaxType, url, params, callbackFunc, callbackFailFunc) {
	jsParamAjaxCallAsync(ajaxType, url, params, true, callbackFunc, callbackFailFunc);
}

function jsParamAjaxCallAsync(ajaxType, url, params, async, callbackFunc, callbackFailFunc) {
	
	$.ajax({
		headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
		type: ajaxType,
		async: async,
		url: url,
		data: params,
		dataType: "json",
		cache: false,
		beforeSend : function(xhr, setting) {
	        if ( setting && setting.async == true ) {
	        	showOverlayUi();
	        }
	    },
		success: function(response, textStatus, jqXHR) {
			$("#overlayDiv").hide();
			
			var statusCode = 0;
			try {
				statusCode = response.data.statusCode;
			} catch(e) {}
			//console.log("ajax result : success " + statusCode);
			if (statusCode == 407) {	// 407:"Could not find the user"
				alert("시스템에서 자동 로그아웃 처리되었습니다.\n시스템을 계속 이용하시려면 다시 로그인하십시오.");
				jsGoLoginPage();
				return;
			} 

			if (callbackFunc) {
				eval(response);
				callbackFunc(response, jqXHR);
			} else {
				// do nothing
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			$("#overlayDiv").hide();

			if (callbackFailFunc) {
				eval(callbackFailFunc + "(jqXHR);");
			} else {
				handleErrorStatus(jqXHR);
			}
		}
	});
}

function showOverlayUi(){
	$("#overlayDiv").css({
		'top' : '0px'
		,'left' : '0px' 
		,'width' : $(window).width() + "px"
		,'height' : $(document).height() + "px"
		,'z-index' : 99999
		,'background' : "#fff"
		,'opacity' : "0.6"
	});
	
	$("#overlayDiv").show();
}

function jsAjaxUpload(url, formId, callbackFunc, callbackFailFunc) {
	var options = {
		url: url,
		type: "POST",
		dataType: "json",
		success: function(response, textStatus, jqXHR) {
			var statusCode = 0;
			try {
				statusCode = response.data.statusCode;
			} catch(e) {}
			//console.log("ajax result : success " + statusCode);
			if (statusCode == 407) {	// 407:"Could not find the user"
				alert("시스템에서 자동 로그아웃 처리되었습니다.\n시스템을 계속 이용하시려면 다시 로그인하십시오.");
				jsGoLoginPage();
				return;
			} 
			
        	if (callbackFunc) {
				callbackFunc(response);
			} else {
	            $.each(response.result.files, function (index, file) {
	            	console.log(file.fileNm + "(" + file.fileSizeUnit + ") - " + file.filePath);
	            });
			}
		}
//		error: function(jqXHR, textStatus, errorThrown) {
//			if (!_isBlocked) jsHideBlockLayer("#fileUploadProgressPopup");
//
//			if (callbackFailFunc) {
//				eval(callbackFailFunc + "(jqXHR);");
//			} else {
//				handleErrorStatus(jqXHR);
//			}
//		},
//		beforeSend : function() {			
//			if (!_isBlocked) jsShowBlockLayer("#fileUploadProgressPopup");
//		},
//		uploadProgress : function(event, position, total, percentComplete) {
//			//var progress = parseInt(data.loaded / total * 100, 10);
//            $('#fileProgress .progress_bar').css(
//                'width',
//                percentComplete + '%'
//            );
//		},
//		complete : function(jqXHR) {
//			if (!_isBlocked) jsHideBlockLayer("#fileUploadProgressPopup");
//		}		
	};

	$("#" + formId).ajaxSubmit(options);
}

function jsAjaxFormDataUpload(url, formData, callbackFunc){
	$.ajax({
        type: "POST",
        enctype: 'multipart/form-data',
        url: url,
        data: formData,
        processData: false,
        contentType: false,
        cache: false,
        timeout: 600000,
        success: function(response, textStatus, jqXHR) {
			if (response.result != "error") {	// response.result : success, fail, error
				callbackFunc(response, jqXHR);
			} else {
				handleErrorStatus(jqXHR);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			var errorMsg = 'status(code): ' + jqXHR.status + '\n';
	        errorMsg += 'statusText: ' + jqXHR.statusText + '\n';
	        errorMsg += 'responseText: ' + jqXHR.responseText + '\n';
	        errorMsg += 'textStatus: ' + textStatus + '\n';
	        errorMsg += 'errorThrown: ' + errorThrown;
	        console.log(errorMsg);
			handleErrorStatus(jqXHR);
		}
    });
}