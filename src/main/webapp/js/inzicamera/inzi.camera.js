/**
 * 카메라 촬영 모듈 개발
 * img capture 방식, WebRTC 방식 지원
 * 
 * 결과 이미지 해상도 지정
 * 
 */
var inzicamera = (function($) {
  var 
    CAMERA_MODE = {
      WEB_RTC: 0, // Web Rtc 사용
      INPUT: 1,   // input 태그 사용
      BOTH: 2 // WEB_RTC 지원불가 시 INPUT을 이용
    },
    configMap = {
      image : { // 결과 이미지
        maximum_width: 1200,
        maximum_height: 1200,
        mime_type: 'image/jpeg',
        quality: 0.8
      },

      html_component : {
        header : {
        },
        body : {
        },
        footer : {
        },
      },
    },

    jqueryMap = {
    },

    stateMap = {
      result_image : { // 현재 이미지 정보를 저장하는 용도이나 사용하고 있지 않음
        data: null,
        width: 0,
        height: 0,
        mime_type: 'image/jpeg',
      },
      camera_mode: CAMERA_MODE.BOTH,  // default 설정 BOTH
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
    callbackMap = {
      error: undefined,
      done: undefined,
    },
    moduleMap = {
      camera: undefined,
      editor: undefined,
      preview: undefined,
    },

    initModule,
    setSubModules,

    init,
    buildHtml,
    setJqueryMap,
    initSubModules,
    setSubModulesCallback,

    startTakingPhoto,
    done,
    show,
    hide,
    
    setFullscreenLock,
    setLockRotation,
    onchangeScreenfull,

    postProcess,
    handleError,

    resizeImage,
    defineUnsupportedFunction,
    setModulesCallback
    ;


  initModule = function($container) {
    stateMap.$container = $container;

    try {
      defineUnsupportedFunction();
      // 사용할 모듈 설정
      setSubModules();
      // 초기화
      init();
    } 
    catch (error) {
      handleError(error);
    }
  };

  init = function() {
    // Modules에서 html 가져와서 구성
    buildHtml( );
    // jqueryMap 설정
    setJqueryMap();
    // 각 모듈 초기화
    initSubModules();
    // 콜백 설정
    setSubModulesCallback();
  };

  setSubModules = function() {
    if (stateMap.camera_mode === CAMERA_MODE.WEB_RTC || 
      stateMap.camera_mode === CAMERA_MODE.BOTH) {
        moduleMap.camera = inzicamera.webRtcCamera;
    } 
    else if (stateMap.camera_mode === CAMERA_MODE.INPUT) {
      moduleMap.camera = inzicamera.inputCamera;
    }
    else {
      throw inzicamera.util.common.makeError('Init fail', 'Invalid camera mode');
    }
    moduleMap.preview = inzicamera.preview;
    moduleMap.editor = inzicamera.editor;
  };

  buildHtml = function() {
    var main_html = '';
    stateMap.$container.html(main_html);

    for (var key in moduleMap) {
      var module = moduleMap[key];
      if (module) {
        var html_component = module.getHtmlComponent();
        if (html_component) {
          var element = $('<div />', {
            id: 'izcamera-base-' + key,
            class: 'izcamera-base',
            css : {
              'display': 'none',
            }
          });
          var module_html = ''
            + ' <div class="izcamera-header">'
            + html_component.header.join('')
            + ' </div>'
            + ' <div class="izcamera-body" >'
            + html_component.body.join('')
            + ' </div>'
            + ' <div class="izcamera-footer">'
            + html_component.footer.join('')
            + ' </div>'
            element.html(module_html);
            stateMap.$container.append(element);
        }
      }
    }
  };

  setJqueryMap = function() {
    var $container = stateMap.$container;
    jqueryMap = { 
      $container : $container,
      $base : $container.find('.izcamera-base'),
      $camera : $container.find('#izcamera-base-camera'),
      $preview : $container.find('#izcamera-base-preview'),
      $editor : $container.find('#izcamera-base-editor'),
    };
  };

  initSubModules = function( $container ) {
    for (var key in moduleMap) {
      var module = moduleMap[key];
      if (module) {
        module.initModule( jqueryMap['$' + key] );
        module.hide();
      }
    }
  };

  setSubModulesCallback = function() {
    // 카메라 설정
    // 촬영 완료
    moduleMap.camera.setCallback('capture', function( image_data ) {
      // image_data = blob
      moduleMap.preview.show( image_data, function() {
        moduleMap.camera.hide();
      });
    });
    // 촬영 취소
    moduleMap.camera.setCallback('cancel', function() {
      // image_data = blob
      moduleMap.camera.hide();
    });
    // 크롭할 경우 editor 실행
    moduleMap.camera.setCallback('crop', function( image_data ) {
      // image_data = blob
      // 에디터모드 제거 필요 시 editor > preview로
      moduleMap.editor.show( image_data, function() {
        moduleMap.camera.hide();
      });
    });
    moduleMap.camera.setCallback('error', handleError);

    // 프리뷰 설정
    // 확인
    moduleMap.preview.setCallback('ok', function( image_data ) {
      // 로딩 시 촬영된 화면 남아있게 함
      //moduleMap.preview.hide();
      moduleMap.camera.stop();
      postProcess( image_data );
    });
    // 재촬영
    moduleMap.preview.setCallback('cancel', function( image_data ) {
      // image_data = blob
      // Do something
      URL.revokeObjectURL( image_data.blob );
      moduleMap.camera.show();
      moduleMap.preview.hide();
    });
    moduleMap.preview.setCallback('error', handleError);

    // 에디터 설정
    // 확인
    moduleMap.editor.setCallback('ok', function( image_data ) {
      // 로딩 시 촬영된 화면 남아있게 함
      // moduleMap.preview.hide();
      moduleMap.camera.stop();
      postProcess( image_data );
    });
    // 재촬영
    moduleMap.editor.setCallback('cancel', function( image_data ) {
      // image_data = blob
      // Do something
      URL.revokeObjectURL( image_data.blob );
      moduleMap.camera.show();
      moduleMap.editor.hide();
    });
    moduleMap.editor.setCallback('error', handleError);
  };

  /**
   * 촬영
   * 
   * @param {Function} callback_done 촬영 완료 시 호출되는 콜백함수. callback(Blob) 형태
   * @param {Function} callback_error 에러 발생 시 호출되는 콜백 함수. callback(Error) 형태
   */
  startTakingPhoto = function(callback_done, callback_error) {
    callbackMap.done = callback_done;
    callbackMap.error = callback_error;

    try {
      moduleMap.camera.start( function() {
        inzicamera.util.common.startLoading();
        show();
        moduleMap.camera.show( function() {
          inzicamera.util.common.stopLoading();
        });
        inzicamera.util.common.stopLoading();
      });
    }
    catch (error) {
      handleError( error );
    }
  };
  
  /**
   * 촬영 후 프로세스
   * @param  image_data 이미지 데이터 구조체
   */
  postProcess = function(image_data) {
    try {
      // 1. 촬영된 이미지 축소
      resizeImage( image_data.blob )
        .done( function(blob) {
          image_data.blob = blob;
          done( image_data ); 
        })
        .fail( function(error) {
          throw error;
        })
        .always( function() {
          // 숨기지 않음
          // hide();
        });
    } catch(error) {
      handleError( error );
    }
  };

  done = function(blob) {
    if (blob && callbackMap.done) {
      callbackMap.done( blob );
      URL.revokeObjectURL( blob );
    }
    else if ( !blob) {
      // 취소
      console.log('Unexpected error no image data');
    }
  };

  /**
   * 에러 처리
   * @param {Error} error
   */
  handleError = function(error) {
    // 이 부분 좀 세심하게 처리 필요
    if (error.name === 'WEBRTC_NOT_SUPPORTED') {
      if (stateMap.camera_mode === CAMERA_MODE.BOTH && 
        moduleMap.camera != inzicamera.inputCamera) {
        try {
          console.log('Not support webRtc camera. using input');
          console.log(error);
          // 카메라 모듈 교체, 다시 초기화
          moduleMap.camera = inzicamera.inputCamera;
          init();
          // 에러 없이 그냥 진행
          moduleMap.camera.show();
          return;
        } catch (e) {
          handleError(e);
        }
      }
    }

    hide();
    var error_obj = error;
    if (Error != typeof error_obj) {
      error_obj = inzicamera.util.common.makeError('ERROR', error);
    } 
    if (callbackMap.error) {
      callbackMap.error( error_obj );
    } 
    else {
      alert(error_obj.message);
      throw error_obj;
    }
  };

  /**
   * 촬영된 이미지 축소 ( webRtc, input 공통 )
   * @param {blob} blob 이미지 데이터
   */
  resizeImage = function(blob) {
    return inzicamera.util.image.resize( blob, 
      configMap.image.maximum_width,  // 이미지 최대 너비
      configMap.image.maximum_height, // 이미지 최대 높이
      configMap.image.mime_type,      // 이미지 mime type (image/jpeg, image/png 등)
      configMap.image.quality);       // 이미지 퀄리티 0.00 ~ 1.00 (image/jpeg, image/webp 에서만 사용)
  };

  show = function() {
    $('html, body').scrollTop(0);
    jqueryMap.$container.show();
    jqueryMap.$base.show();
    // base만 표시하고 모듈들은 Hide 처리
    hideAndStopModules( false );

    setFullscreenLock( false );

    // html,body의 scroll을 hidden시킴
    $('html, body').css({'overflow': 'hidden'});

    // 터치무브와 마우스휠 스크롤 방지
    /*
    $('#element').on('scroll touchmove mousewheel', function(event) { 
      event.preventDefault();
      event.stopPropagation();
      return false;
    });
    */
  };

  hide = function() {
    if (jqueryMap.$container) {
      setFullscreenLock( false );
    
      jqueryMap.$container.hide();
      jqueryMap.$base.hide();
      hideAndStopModules( true );
    }

    inzicamera.util.common.stopLoading();
    $('html, body').css({'overflow': 'auto'}); //scroll hidden 해제 
    // $('#element').off('scroll touchmove mousewheel'); // 터치무브 및 마우스휠 스크롤 가능
  };

  hideAndStopModules = function(stop) {
    for (var key in moduleMap) {
      var module = moduleMap[key];
      if (module) {
        if (stop && module.stop) {
          module.stop();
        }
        module.hide();
      }
    }
  };

  /**
   * CSS ViewPort 계산을 위한 이벤트
   * 브라우저 주소창으로 인한 사이즈 오류 해결을 위함
   */
  var vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  window.addEventListener('resize', function(){
    // We execute the same script as before
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });

  setFullscreenLock = function(setFullscreen) {
    // 전체 화면 전환
    if (moduleMap.camera == inzicamera.webRtcCamera && screenfull.isEnabled && !screenfull.isFullscreen) {
      if (setFullscreen) {
        var promise = screenfull.request( jqueryMap.$container.get(0) );
        promise.then( function() {
          screenfull.on( 'change', onchangeScreenfull );
        });
      }
      else {
        screenfull.off( 'change', onchangeScreenfull );
        screenfull.exit( jqueryMap.$container.get(0) );
      }
      // 회전 잠금 (Full screen에서만 지원)
      setLockRotation( setFullscreen );
    } else {
      // Screen full not available
    }
  };

  onchangeScreenfull = function( event ) {
    if ( !screenfull.isFullscreen) {
      screenfull.off( 'change', onchangeScreenfull);
      console.log('Fullscreen off');
      hide();
    }
  };

  /**
   * 회전을 잠금
   * iOS에서는 지원하지 않음
   */
  setLockRotation = function(setLock) {
    if (setLock && window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock('landscape')
      .then( function(data){
        console.log( 'Device orientation locked: ' + data);
      } )
      .catch( function(error) {
        console.log( 'Device orientation lock failed (landscape): ' + error.message);
        window.screen.orientation.lock('portrait-primary').catch( function( error ) {
          console.log( 'Device orientation lock failed (portrait-primary): ' + error.message);
        });
      });
    } 
    else if ( !setLock && window.screen.orientation && window.screen.orientation.unlock) {
      window.screen.orientation.lock('portrait-primary').catch( function( error ) {
        console.log( 'Device orientation lock failed (portrait-primary): ' + error.message);
      });
      window.screen.orientation.unlock();
    } else {
      // Do nothing
    }
  };

    /**
   * 브라우저 호환 API 설정
   * Canvas.toBlob
   * window.requestAnimationFrame
   */
  defineUnsupportedFunction = function() {
    // Canvas toBlob (Edge의 경우 해당 메소드가 없어 선언)
    if (!HTMLCanvasElement.prototype.toBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback, type, quality) {
        var canvas = this;
        setTimeout(function() {
          var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
          len = binStr.length,
          arr = new Uint8Array(len);
    
          for (var i = 0; i < len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
          }
          callback(new Blob( [arr], {type: type || 'image/png'} ));
        });
        }
      });
    }
    // requestAnimationFrame 지원
    window.requestAnimationFrame = (function( callback ) {
      return window.requestAnimationFrame || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame || 
      window.oRequestAnimationFrame || 
      window.msRequestAnimationFrame ||
      function( callback ) { window.setTimeout( callback, 1000 / 60 ); };
    }());
  };

  return { 
    initModule: initModule,
    startTakingPhoto: startTakingPhoto,
  };
})(jQuery);