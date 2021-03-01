/**
 * 미리보기 화면
 * 
 */
inzicamera.preview = (function($) {
  var 
    configMap = {
      module_name : 'preview',
      html_component : {
        header : [
          ' <div class="izcamera-header-text">미리보기</div>',
        ],
        body: [
          ' <div class="izcamera-body-preview" >',
          '   <img class="izcamera-body-preview-img"></img>',
          ' </div>'
        ],
        footer: [
          ' <div class="izcamera-footer-preview" >',
          '    <button class="button izcamera-footer-preview-button-ok" type="button" >확인</button>',
          '    <button class="button izcamera-footer-preview-button-cancel" type="button">재촬영</button>',
          ' </div>'
        ],
      },
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
      error: undefined,
      done: undefined,
      cancel: undefined,
    },
    
    initModule, 
    setJqueryMap,
    getName,
    getHtmlComponent,

    bindEvent,
    setCallback,

    calcImageSizeAndPos,
    calcImageSize,
    calcImagePosition,
    
    onloadImg,
    onerrorImg,
    onclickOk,
    onclickCancel,
    
    execute,
    handleError
    ;

  initModule = function($container) {
    stateMap.$container = $container;

    setJqueryMap();
    bindEvent();
  };
  
  setJqueryMap = function() {
    var $container = stateMap.$container;
    jqueryMap = { 
      $container : $container,
      $body : $container.find('.izcamera-body-preview'),
      $img : $container.find('.izcamera-body-preview-img'),
      $footer: $container.find('.izcamera-footer-preview'),
      $button_ok : $container.find('.izcamera-footer-preview-button-ok'),
      $button_cancel : $container.find('.izcamera-footer-preview-button-cancel'),
    };
  };

  getName = function() {
    return configMap.module_name;
  };

  getHtmlComponent = function() {
    return configMap.html_component;
  };

  bindEvent = function() {
    jqueryMap.$img.bind( 'load', onloadImg );
    jqueryMap.$img.bind( 'error', onerrorImg );

    jqueryMap.$button_ok.bind( 'click', onclickOk );
    jqueryMap.$button_cancel.bind( 'click', onclickCancel );
  };

  calcImageSizeAndPos = function() {
    calcImageSize();
    calcImagePosition();
  };

  /**
   * img Element 크기 계산
   * 실제 이미지 기준으로 body에 꽉 차도록 계산
   */
  calcImageSize = function() {
    var elem_img = jqueryMap.$img.get(0);
    var image_width = elem_img.naturalWidth;
    var image_height = elem_img.naturalHeight;
    var image_ratio = image_width / image_height;

    var elem_body = jqueryMap.$body.get(0);

    var w_ratio = elem_body.clientWidth / image_width;
    var h_ratio = elem_body.clientHeight / image_height;

    if (w_ratio < h_ratio) {
      elem_img.width = elem_body.clientWidth;
      elem_img.height = elem_body.clientWidth / image_ratio;
    } 
    else {
      elem_img.height = elem_body.clientHeight;
      elem_img.width = elem_body.clientHeight * image_ratio;
    }
  };
  /**
   * img element 위치 계산
   * body 가운데 위치
   */
  calcImagePosition = function() {
    var elem_img = jqueryMap.$img.get(0);
    var elem_body = jqueryMap.$body.get(0);

    var margin_width = elem_body.clientWidth - elem_img.width;
    var margin_x = 0;
    if (margin_width > 0) {
      margin_x = margin_width / 2;
    }
    var margin_height = elem_body.clientHeight - elem_img.height;
    var margin_y = 0;
    if (margin_height > 0) {
      margin_y = margin_height / 2;
    }
    elem_img.style.margin = margin_y + 'px ' + margin_x + 'px';
  };

  onloadImg = function(event) {
    URL.revokeObjectURL(event.target.src);
    // 이미지가 로딩된 타이밍

    jqueryMap.$container.show();

    calcImageSizeAndPos();
    if (callbackMap.show) {
      callbackMap.show();
    }
  };

  onerrorImg = function($error) {
    if ($error.type === 'error') {
      handleError('Preview image load failed');
    }
  };

  onclickOk = function(event) {
    if ( stateMap.image_data ) {
      if (callbackMap.ok) {
        callbackMap.ok( stateMap.image_data );
      }
    } else {
      handleError('No image data');
    }
  };

  onclickCancel = function(event) {
    if (callbackMap.cancel) {
      callbackMap.cancel(stateMap.image_data);
    }
  };

  /**
   * Preview 화면 표시
   * 
   * @param * image_data 이미지 데이터 구조체 stateMap.image_data 참고
   */
  execute = function( image_data ) {
    stateMap.image_data = image_data;
    try {
      var url = URL.createObjectURL(stateMap.image_data.blob);
      jqueryMap.$img.get(0).src = url;
    } 
    catch (error) {
      handleError( error );
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

  show = function( image_data, callback_function ) {
    stateMap.image_data = image_data;
    if (callback_function) {
      callbackMap.show = callback_function;
    }
    $('html, body').css({'overflow': 'hidden', 'height': '100%', 'position': 'fixed'});
    
    window.addEventListener( 'resize', calcImageSizeAndPos );
    execute( image_data );
  };

  hide = function() {
    stateMap.image_data.reset();

    window.removeEventListener( 'resize', calcImageSizeAndPos );
    jqueryMap.$container.hide();
  };

  setCallback = function(key, callbackFunction) {
    callbackMap[key] = callbackFunction;
  };

  return { 
    initModule: initModule,
    getName: getName,
    getHtmlComponent : getHtmlComponent,
    show: show,
    hide: hide,
    setCallback: setCallback,
  };
})(jQuery);
