inzicamera.util = (inzicamera.util? inzicamera.util: {});

inzicamera.util.common = (function() {
  var 
    makeError,
    getBrowserInfo, // 브라우저 정보 (아직 미구현)
    getDeviceInfo,   // 단말 정보 (아직 미구현)
    consoleLog,
    clone,
    startLoading,
    stopLoading
    ;

  makeError = function(name, message) {
    var error = new Error();
    error.name = name;
    error.message = message;

    return error;
  };

  /**
   * 설정된 모드에 따라 
   */
  consoleLog = function(message) {
    
  };

  startLoading = function() {
	var width = 0;
	var height = 0;
	var left = 0;
	var top = 0;
	
	width = 150;
	height = 150;
	
	top = ( $(window).height() - height ) / 2 + $(window).scrollTop();
	left = ( $(window).width() - width ) / 2 + $(window).scrollLeft();
	if($("#div_ajax_load_image").length != 0 || $("#div_ajax_load_layer").length != 0 ) {
		$("#div_ajax_load_image").css({
			"top": top+"px",
			"left": left+"px"
		});
		$("#div_ajax_load_image").show();
		$("#div_ajax_load_layer").show();
	}
	else {
		$('#inziCamera').append('<div id="div_ajax_load_layer" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:150; background:#000000; opacity:0.5; ">');
		$('#inziCamera').append('<div id="div_ajax_load_image" style="position:absolute; top:' + top + 'px; left:' + left + 'px; width:' + width + 'px; height:' + height + 'px; z-index:150; background:#ffffff; filter:alpha(opacity=1); opacity:alpha*1; margin:auto; padding:0; border:5px solid RoyalBlue;"><img src="images/loading.gif" style="position:absolute; top:0; left:0; width:100%; height:100%;"></div>');
	}
  };

  stopLoading = function() {
    console.log(' 로딩 애니메이션 끝 ');
    $("#div_ajax_load_image").hide();
	$("#div_ajax_load_layer").hide();
  };

  clone = function(object) {
    if (object === null || typeof(object) !== 'object') {
      return object;
    }
    var copy = object.constructor();
    for (var attr in object) {
      if (object.hasOwnProperty(attr)) {
        copy[attr] = object[attr];
      }
    }
    return copy;
  };

  return {
    makeError: makeError,
    startLoading: startLoading,
    stopLoading: stopLoading,
    clone: clone,
  };
}());