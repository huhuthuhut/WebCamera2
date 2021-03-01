
/*jslint           browser : true, continue : true,
	devel  : true, indent  : 2,    maxerr   : 50,
    newcap : true, nomen   : true, plusplus : true,
    regexp : true, sloppy  : true, vars     : false,
    white  : true
*/
inzicamera.inputCamera = (function(){
  'use strict';

  var configMap = {
    name : 'inputCamera',
    html_component : null
  },
  stateMap = {
    image_data : {
      blob: null,
      cropped: false,
      width: 0,
      height: 0,
      guide_rect: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      reset: function() {
        var data = stateMap.image_data;
        data.blob = null;
        data.cropped = false;
        data.width = 0;
        data.height = 0;
        data.guide_rect.left = 0;
        data.guide_rect.top = 0;
        data.guide_rect.width = 0;
        data.guide_rect.height = 0;
      },
    }
  },
  jqueryMap = {
  },
  callbackMap = {
    start: undefined,
    stop: undefined,
    capture: undefined,
    cancel: undefined,
    error: undefined,
  },

  // 초기화 메소드
  initModule,
  setJqueryMap,
  canSupport,
  getName,
  getHtmlComponent,

  // 이벤트 메소드,
  onChangeInputFile,

  // 
  startTakingPhoto,
  completeTakingPhoto,

  start,
  stop,
  show,
  hide,
  setCallback,
  handleError
  ;

  initModule = function( $container ) {
    canSupport();
     
    stateMap.$container = $container;
    setJqueryMap();
  };

  setJqueryMap = function() {
    var $container = stateMap.$container;
    $container.html( configMap.main_html );
    jqueryMap = { 
      $container : $container,
      $base : $container.find('.izCamera-base'),
      $body : $container.find('.izCamera-body-camera'),
    };
  };

  getName = function() {
    return configMap.module_name;
  };

  getHtmlComponent = function() {
    return configMap.html_component;
  };

  onChangeInputFile = function( event ) {
    var file = jqueryMap.$input.get(0).files[0];
    if (file) {
      completeTakingPhoto(file);
    } else {
      handleError('No file');
    }
  };

  startTakingPhoto = function( ) {
    // file src를 새로 설정할 수 없는 경우가 있어 매번 생성
    jqueryMap.$input = $('<input />', {
      type: 'file',
      id: 'captureFile',
      accept: 'image/*',
      capture: '',
    });

    jqueryMap.$input.bind( 'change', onChangeInputFile );
    $('html, body').css({'overflow': 'auto'});
    jqueryMap.$input.click();
  };

  completeTakingPhoto = function( file ) {
    var callback_data = inzicamera.util.common.clone(stateMap.image_data);
    callback_data.blob = file;

    if (file && callbackMap.capture) {
      callbackMap.capture( callback_data );
    }
  };

  canSupport = function() {
    return true;
  };

  start = function( callback_function ) {
    if (callback_function) {
      callbackMap.start = callback_function;
      callbackMap.start();
    }
  };

  stop = function( callback_function ) {
    if (callback_function) {
      callbackMap.stop = callback_function;
      callbackMap.stop();
    }
  };

  show = function( callback_function ) {
    if (callback_function) {
      callbackMap.show = callback_function;
      callbackMap.show();
    }
    if (jqueryMap.$container) {
      jqueryMap.$container.show();
    }
    startTakingPhoto();
  };

  hide = function() {
    if (jqueryMap.$container) {
      jqueryMap.$container.hide();
    }
  };

  setCallback = function( key, callback_function ) {
    if (callback_function) {
      callbackMap[key] = callback_function;
    }
  };

  /**
   * 에러 처리
   * @param {Error} error
   */
  handleError = function(error) {
    var error_obj = error;
    console.log( error );
    if (Error != typeof error_obj) {
      error_obj = inzicamera.util.common.makeError('PREVIEW_ERROR', error);
    } 
    if (callbackMap.error) {
      callbackMap.error( error_obj );
    } 
    else {
      throw error_obj;
    }
  };

  return { 
    initModule: initModule,
    canSupport: canSupport,
    startTakingPhoto: startTakingPhoto,
    getName: getName,
    getHtmlComponent: getHtmlComponent,

    start: start,
    stop: stop,
    show: show,
    hide: hide,
    setCallback: setCallback,
  };
})();