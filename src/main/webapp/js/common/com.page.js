/**
 * block 상태 여부 
 */
var _isBlocked = false;

/**
 * Popup Layer Load
 * 
 * @param obj		팝업 ID
 * @param options 	{left:pixel top:pixel}
 * @returns
 */
function jsShowBlockLayer(obj, options) {
	options = options || {};

	var width = $(obj).width();
	var height = $(obj).height();
	var windowHeight = window.document.body.offsetHeight;
	var scrollPos = $(document).scrollTop();

	var left = 0;
	if (options.left) {
		left = options.left;
	} else {
		left = ($(document).width() - width) / 2;
		left = (left > 0) ? left : 0;
	}
	var top = 0;
	if (options.top) {
		top = options.top;
	} else {
		top = (windowHeight - height) / 2 + scrollPos;
	}

	$(obj).css("width", width);
	$(obj).css("height", height);
	// $(obj).css("backgroundColor", "#fff");
	// $("html").animate({scrollTop : top}, 100);
	$.blockUI({
		constrainTabKey : false,
		message : $(obj),
		css : {
			border : 'none',
			top : top + 'px',
			left : left + 'px',
			width : '0px',
			height : '0px',
			textAlign : "",
			cursor : 'default',
			position : "absolute"
		},
		overlayCSS : {
			backgroundColor : '#666',
			opacity : 0.6,
			cursor : 'default'
		},
		onBlock : function() {
			$("body").css({
				"overflow" : "auto"
			});
		},
		onUnblock : function() {
			$("body").css({
				"overflow" : "auto"
			});
		},
		focusInput : false
	});
}

/**
 * Popup Layer Close
 * 
 * @param obj
 * @returns
 */
function jsHideBlockLayer(obj) {
	if ($(obj).is(":visible")) {
		$(obj).hide();
	}
	$.unblockUI();
	_isBlocked = false;
}

/**
 * 페이지 넘버링 설정
 * @param pageNo:현재페이지
 * @param totalCount:전체 항목 수
 * @param pageSize:페이지당 항목 수
 * @returns
 */
function jsPageNumbering(pageNo, totalCount, pageSize) { 
	jsPaging(pageNo, totalCount, pageSize, 10, "jsPage", "divPaging");
} 

/**
 * 페이지 넘버링 설정 : << < 11 12 13 14 15 16 17 18 19 20 > >>
 * 
 * @param pageNo : 현재페이지
 * @param totalCount : 전체 항목 수
 * @param pageSize : 페이지당 항목 수
 * @param pageBlock : 한번에 보여지는 최대 페이지 수
 * @param fn : 페이징 처리 함수명
 * @param id : 페이지 표시 div id
 * @returns
 */
function jsPaging(pageNo, totalCount, pageSize, pageBlock, fn, id) { 
	var totalPageCount = toInt(totalCount / pageSize) + (totalCount % pageSize > 0 ? 1 : 0);
	var totalBlockCount = toInt(totalPageCount / pageBlock) + (totalPageCount % pageBlock > 0 ? 1 : 0);
	var blockNo = toInt(pageNo / pageBlock) + (pageNo % pageBlock > 0 ? 1 : 0);
	var startPageNo = (blockNo - 1) * pageBlock + 1;
	var endPageNo = blockNo * pageBlock;

	//console.log(totalPageCount + " / " + totalBlockCount + " / " + blockNo + " / " + startPageNo + " / " + endPageNo);

	if (endPageNo > totalPageCount) {
		endPageNo = totalPageCount;
	}
	var prevBlockPageNo = (blockNo - 1) * pageBlock;
	var nextBlockPageNo = blockNo * pageBlock + 1;
	
	var strHTML = "";
	if (totalPageCount > 1 && pageNo != 1 && blockNo > 1) {
		strHTML += "<a href='javascript:" + fn + "(1);' class='mr10'><img src='"+_contextRoot+"images/btn_first.gif'  alt='처음' /></a>";
	}
	if (prevBlockPageNo > 0) {
		strHTML += "<a href='javascript:" + fn + "(" + prevBlockPageNo + ");' class='mr10'><img src='"+_contextRoot+"images/btn_prev.gif'  alt='이전' /></a>";
	}
	strHTML += "<span class='num'>";
	for (var i = startPageNo; i <= endPageNo; i++) {
		if (i == pageNo) {
			strHTML += "<strong class='firstItem on' title='현재 페이지 입니다'>" + i + "</strong>\n";
		} else {
			strHTML += "<a href='javascript:" + fn + "(" + i + ");'>" + i + "</a>\n";
		}
	}
	strHTML += "</span>";
	if (nextBlockPageNo <= totalPageCount) {
		strHTML += "<a href='javascript:" + fn + "(" + nextBlockPageNo + ");' class='ml8'><img src='"+_contextRoot+"images/btn_next.gif'  alt='다음'/></a>";
	}
	if (totalPageCount > 1 && pageNo != totalPageCount && blockNo < totalBlockCount) {
		strHTML += "<a href='javascript:" + fn + "(" + totalPageCount + ");' class='ml10'><img src='"+_contextRoot+"images/btn_end.gif'  alt='마지막'/></a>";
	}

	$('#' + id).html(strHTML);
}

function jsUploadFile(fileInputId, callbackFunc) {
    $('#' + fileInputId).fileupload({
        url: '/attach/upload',
        dataType: 'json',
        add: function (e, data) {
        	if (!_isBlocked) jsShowBlockLayer("#fileUploadProgressPopup");
    		
        	data.submit();
        },
        done: function (e, data) {
        	if (!_isBlocked) jsHideBlockLayer("#fileUploadProgressPopup");
        	
        	if (callbackFunc) {
				callbackFunc(data);
			} else {
	            $.each(data.result.files, function (index, file) {
	            	console.log(file.fileNm + "(" + file.fileSizeUnit + ") - " + file.filePath);
	            });
			}
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#fileProgress .progress_bar').css(
                'width',
                progress + '%'
            );
        }
    });
}

function jsCheckboxControl(allCheckboxName, checkboxName, allCheckboxFunc, checkboxFunc) {
	$(document).on("change", "input[type='checkbox'][name='" + allCheckboxName+ "'], input[type='checkbox'][name='" + checkboxName+ "']", function() {
		var _allCheckbox = $("input[name='"+ allCheckboxName + "']");
		var _checkbox = $("input[name='" + checkboxName+ "']");
	
		if ($(this).attr("name") == allCheckboxName) {
			_checkbox.filter(":not([disabled])").prop("checked", this.checked);
		} else {
			if (_checkbox.filter(":not([disabled])").length == _checkbox.filter(":checked").length) {
				_allCheckbox.prop("checked", true);
			} else {
				_allCheckbox.prop("checked", false);
			}
		}
	
		if ($.isFunction(allCheckboxFunc)) {
			allCheckboxFunc(_allCheckbox.prop("checked"));
		}
		if ($.isFunction(checkboxFunc)) {
			checkboxFunc((_checkbox.filter(":checked").length > 0));
		}
	});
}

function jsShowPopupLayer(obj, options) {
	options = options || {};
	
	var width = $(obj).width();
	var height = $(obj).height();
	var windowHeight = window.document.body.offsetHeight;
	var scrollPos = $(document).scrollTop();

	var left = 0;
	if (options.left) {
		left = options.left;
	} else {
		left = ($(document).width() - width) / 2;
		left = (left > 0) ? left : 0;
	}
	var top = 0;
	if (options.top) {
		top = options.top;
	} else {
		top = (windowHeight - height) / 2 + scrollPos;
	}
	
	$(obj).bPopup({
		modalClose: false,
	    opacity:options.opacity || 0.4,
	    followSpeed: options.followSpeed || 'fast',
	    speed: options.speed || 500,
	    follow: [false, false], 
	    position: [(left ? left : 'auto'), (top ? top : 'auto')],
	    escClose: false
	    //onOpen: function() { },
	    //onClose: function() { }
	});
}

function jsHidePopupLayer(obj) {
	$(obj).bPopup().close();
}

function jsTrimInputValue(formId) {
	$("#"+formId+" input").each(function(index, item) {
		$(item).val($.trim($(item).val()));
	});
}
