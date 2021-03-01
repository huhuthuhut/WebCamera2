
/*jslint           browser : true, continue : true,
	devel  : true, indent  : 2,    maxerr   : 50,
    newcap : true, nomen   : true, plusplus : true,
    regexp : true, sloppy  : true, vars     : false,
    white  : true
*/
inzicamera.webRtcCamera = (function(){
  'use strict';
  
  // Variables
  var 
    // 현재 모듈 상태
    MODULE_STATE = {
      NOT_INIT: 0,       // 'Not yet initialized',
      INITIALIZING: 1,   // 'Initializing',
      READY_CAPTURE: 2,  // 'Ready capture',
      CAPTURING: 3,      // 'Capturing',
    },
    configMap = {
      name: 'webRtcCamera',

      html_component : {
        header : [
        ],
        body : [
          '   <div class="izcamera-body-camera" >',
          '     <canvas class="izcamera-body-camera-canvas"></canvas>',
          '     <video class="izcamera-body-camera-video"></video>',
          '  </div>'
        ], 
        footer : [
          '<div class="izcamera-footer-camera" >',
          '  <div class="izcamera-footer-camera-upside">',
          '    <select class="izcamera-footer-camera-upside-select"></select>',
          '  </div>',
          '  <div class="izcamera-footer-camera-downside">',
          '    <div class="izcamera-footer-camera-button div-center">',
          '      <button class="izcamera-footer-camera-downside-button-capture" type="button"></button>',
          '      <button class="izcamera-footer-camera-downside-button-crop" type="button">',
          '        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16825d" width="36px" height="36px">',
          '          <path d="M0 0h24v24H0V0z" fill="none"/>',
          '          <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/>',
          '        </svg>',
          '      </button>',
          '      </div>',
          '  </div>',
          '</div>'
        ],
      },

      constraints : {
        audio: false,
        video: {
          // 해상도를 설정할 수 있도록 하려면 여기 부분을 수정하는 것을 추천
          width: { ideal: 1280 }, height: { ideal: 920 },
          frameRate: { min: 10, ideal: 30, max: 60 },
          facingMode: { exact: "environment" }, // 후면카메라 모드(노트북 테스트 시 주석)
        },
      },
      guide_line : {
        draw: true,
        ratio: 1.574,  // 가이드영역 가로세로비율
        min_margin_percent: 0.1, // 10%
      },
      canvas : {
        ratio: 0.95,  // 가로, 세로 장축 기준 body 영역대비 Canvas 비율
      },
      capture_image : {
        mime_type: 'image/jpeg',
        quality: 0.8,
      },
      repeat_draw : {
      	time: 300 // 회전 반영을 위해 한번 더 canvas에 그림/ 웹에서 단위: ms
      },
    },
    stateMap = {
      state: MODULE_STATE.NOT_INIT,
      video_devices: [],
      current_device_id: '',
      video: {
        width: 0, height: 0, ratio: 0,
      },
      canvas_rect: {
        left: 0, right: 0, width: 0, height: 0,
      },
      guide_line_rect: {
        left: 0, right: 0, width: 0, height: 0,
      },
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
      done: undefined,
      error: undefined,
      cancel: undefined,
    },

    // 초기화 메소드
    initModule,
    getName,
    getHtmlComponent,
    bindEvent,
    setCallback,
    canSupport,
    setJqueryMap,
    enumerateDevices,
    setCameraSelect,
    setLockRotation,

    // 이벤트 메소드
    onChangeCameraSelect,
    onLoadedmetadata,
    onClickCaptureButton,
    onClickCrop,
    onResizeWindow,

    // 
    setState,
    startTakingPhoto,
    startCaptureMode,
    completeTakingPhoto,
    endTakingPhoto,
    startVideo,
    stopVideo,
    getMediaStream,
    getDrawingTimeout,
    calculateSizeDrawing,
    calculateSizeCanvas,
    calculateSizeGuideLine,
    drawCameraCanvas,
    drawVideo,
    drawGuideLine,
    drawLayer,
    videoStreamToBlob,

    handleError,
    makeError,

    start,
    stop,
    show,
    hide
    ;

  initModule = function( $container ) {
    if (stateMap.state !== MODULE_STATE.NOT_INIT) {
      handleError( makeError( 'Init fail', 'Already initialized' ));
    }
    
    try {
      // 일단 초기화가 완료되면 상태 변경
      setState( MODULE_STATE.INITIALIZING );

      // 호환성 여부 체크
      canSupport();

      stateMap.$container = $container;
      setJqueryMap();

      bindEvent();

      // Video 초기화 및 이벤트 설정
      jqueryMap.$video.attr( 'autoplay', '' );
      jqueryMap.$video.attr( 'muted', '' );
      jqueryMap.$video.attr( 'playsinline', '' );
      
      // 지원되는 Video device 목록 가져오기 (비동기 처리)
      enumerateDevices( )
        .done( function(data) {
          setCameraSelect();
          setState( MODULE_STATE.READY_CAPTURE );
        });
    }
    catch (error) {
      handleError( error );
    }
  };

  getName = function() {
    return configMap.name;
  };

  getHtmlComponent = function() {
    return configMap.html_component;
  };

  bindEvent = function() {
    // Video에 Stream 로드되었을 때
    jqueryMap.$video.on( 'loadedmetadata', onLoadedmetadata );

    // 촬영 버튼 이벤트 설정
    jqueryMap.$button_capture.on( 'click', onClickCaptureButton);

    // Select menu change 이벤트 시 카메라 변경
    // 카메라 선택 UI 변경 시 삭제
    jqueryMap.$select_device.on( 'change', onChangeCameraSelect );
    
    jqueryMap.$button_crop.on( 'click', onClickCrop );
  };
  
  setCallback = function(key, callbackFunction) {
    callbackMap[key] = callbackFunction;
  };

  /**
   * 현재 접속한 단말에서 Web RTC 사용 가능 여부 확인
   */
  canSupport = function() {
    // 단말 종류 (Android, iOS) 및 브라우저 버전 확인
    // 아직은 구분하지 않음

    // 사용하고 있는 객체 및 메소드 지원여부 체크
    if ( !navigator.mediaDevices ||
        !navigator.mediaDevices.enumerateDevices ||
        !navigator.mediaDevices.getUserMedia ||
        !Blob ||
        !Promise ) {
          try {
            // 에러 메시지를 구체적으로 띄우고 싶어서 사용
            var required = [
              navigator.mediaDevices,
              navigator.mediaDevices.enumerateDevices,
              navigator.mediaDevices.getUserMedia,
              Blob,
              Promise,
            ];
          }
          catch ( error ) {
            handleError( makeError( 'WEBRTC_NOT_SUPPORTED', error.message ));
          }
    }
  };

  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = { 
      $container : $container,
      $base : $container.find('.izcamera-base'),
      $body : $container.find('.izcamera-body-camera'),
      $video : $container.find('.izcamera-body-camera-video'),
      $canvas : $container.find('.izcamera-body-camera-canvas'),
      $canvas_layer : $container.find('.izcamera-body-camera-canvas-layer'),
      $footer : $container.find('.izcamera-footer-camera'),
      $select_device : $container.find('.izcamera-footer-camera-upside-select'),
      $button_capture : $container.find('.izcamera-footer-camera-downside-button-capture'),
      $button_crop : $container.find('.izcamera-footer-camera-downside-button-crop'),
    };
  };

  enumerateDevices = function() {
    var $deferred = $.Deferred();

    var video_devices = [];
    if ( navigator.mediaDevices.enumerateDevices ) {
      navigator.mediaDevices.enumerateDevices().then(
        function getDevice(media_devices) {
          media_devices.forEach( function(media_device, idx) {
            if(media_device.kind === 'videoinput'&& media_device.label.indexOf('front') === -1) {
              video_devices.push( media_device );
            }
          });
          stateMap.video_devices = video_devices;
          $deferred.resolve();
        }
      );
    }
    return $deferred.promise();
  };

  setCameraSelect = function() {
    jqueryMap.$select_device.empty();
    if ( stateMap.video_devices ) {
      for ( var idx in stateMap.video_devices ) {
        var video_device = stateMap.video_devices[idx];
        var text = '카메라 '+idx;
        var option = new Option(text, video_device.deviceId);
        if(idx == stateMap.video_devices.length - 1){
          option.selected = true;
        }
        option.style.color = 'white';
        jqueryMap.$select_device.append($(option));
      }
    }
    if (jqueryMap.$select_device.length > 0) {
      stateMap.current_device_id = jqueryMap.$select_device[jqueryMap.$select_device.length];
    } else {
      stateMap.current_device_id = "";
    }
    stateMap.current_device_id = jqueryMap.$select_device.val();
  };

  onChangeCameraSelect = function( event ) {
    stateMap.current_device_id = jqueryMap.$select_device.val();
    stopVideo();
    startCaptureMode();
  };

  onLoadedmetadata = function( event ) {
    if (callbackMap.show) {
      callbackMap.show();
    }

    // 화면 영역 계산
    calculateSizeDrawing();
    // Canvas 그리기
    drawCameraCanvas();
  };

  onClickCaptureButton = function( event ) {
    videoStreamToBlob( false, callbackMap.capture );
  };

  onClickCrop = function( event ) {
    // 에디터모드 제거 필요 시 false > true로
    videoStreamToBlob( false, callbackMap.crop );
  };

  videoStreamToBlob = function ( be_crop, callback_function ) {
    var st = new Date().getMilliseconds();
    var video_target_rect = {
      left: 0, top: 0, width: stateMap.video.width, height: stateMap.video.height,
    };

    var guide_rect = stateMap.guide_line_rect;
    var canvas_video_ratio = stateMap.video.width / stateMap.canvas_rect.width;
    var crop_rect = { left:0, top:0, width:0, height:0 };
    crop_rect.left = canvas_video_ratio * guide_rect.left;
    crop_rect.top = canvas_video_ratio * guide_rect.top;
    crop_rect.width = canvas_video_ratio * guide_rect.width;
    crop_rect.height = canvas_video_ratio * guide_rect.height;
    
    if (be_crop) {
      video_target_rect = crop_rect;
    }

    var $canvas = $('<canvas />');
    $canvas.get(0).width = video_target_rect.width;
    $canvas.get(0).height = video_target_rect.height;

    var canvas_2d_context = $canvas.get(0).getContext('2d');
    canvas_2d_context.drawImage( jqueryMap.$video.get(0), 
      video_target_rect.left, video_target_rect.top, 
      video_target_rect.width, video_target_rect.height,
      0, 0, $canvas.get(0).width, $canvas.get(0).height);
    $canvas.get(0).toBlob( function( blob ) {
      var end = new Date().getMilliseconds();
      console.log('Capturing time : ' + (end - st));

      var callback_data = inzicamera.util.common.clone(stateMap.image_data);
      callback_data.blob = blob;
      callback_data.width = video_target_rect.width;
      callback_data.height = video_target_rect.height;
      callback_data.cropped = be_crop;
      callback_data.guide_rect = crop_rect;

      if (callback_function) {
        callback_function( callback_data );
      }
    },
    configMap.capture_image.mime_type, configMap.capture_image.quality );
  };

  onResizeWindow = function( event ) {
		setTimeout(function() {
			  calculateSizeDrawing();
			    drawCameraCanvas();
		    }, configMap.repeat_draw.time);
		calculateSizeDrawing();
	    drawCameraCanvas();
  };

  completeTakingPhoto = function(blob) {
    endTakingPhoto();
    
    if (blob && callbackMap.done) {
      callbackMap.done( blob );
    }
  };

  endTakingPhoto = function() {
    // Video stream 정지
    stopVideo();

    setState( MODULE_STATE.READY_CAPTURE );

    if (callbackMap.stop) {
      callbackMap.stop();
    }
  };

  setState = function(state) {
    var valid_state = false;
    for (var key in MODULE_STATE) {
      if (MODULE_STATE[key] === state) {
        stateMap.state = state;
        valid_state = true;
      }
    }
    if (!valid_state) {
      handleError( makeError('WebRtc invalid state', 'Using invalid state: ' + state));
    }
  };

  startTakingPhoto = function() {
    if (stateMap.state !== MODULE_STATE.READY_CAPTURE) {
      handleError( makeError( 'Not ready', 'State is not ready state:' + stateMap.state ));
    }
    setState( MODULE_STATE.CAPTURING );
    startCaptureMode();
  };

  startCaptureMode = function() {
    getMediaStream()
      .then( function( stream ) {
        // 디버깅용도 Stream 설정 출력
        stream.getVideoTracks().forEach( function(track, idx, arr) {
          if (track.enabled) {
            console.log('Video stream Settings');
            console.log(JSON.stringify(track.getSettings(), null, 2));
            console.log('Video stream Capabilites');
            console.log(JSON.stringify(track.getCapabilities(), null, 2));
          }
        });
        
        if (callbackMap.start) {
          callbackMap.start();
        }
        // 이미지 그릴 타임아웃 설정
        getDrawingTimeout( stream );
        // video에 Stream 설정 및 Play
        startVideo( stream );
      })
      .catch( function( error ) {
        handleError( makeError( 'WEBRTC_NOT_SUPPORTED', 'getMediaStream failed: ' + error.message ) );
      });
  };

  getMediaStream = function() {
    var constraints = Object.assign({}, configMap.constraints);
    if (stateMap.current_device_id) {
      constraints.video.deviceId = { exact: stateMap.current_device_id };
    }
    return navigator.mediaDevices.getUserMedia( constraints );
  };

  /**
   * .izCamera-body-camera 의 크기와
   * .izCamera-body-camera-video 의 비율로
   * 촬영 화면이 그려질 영역을 계산
   */
  calculateSizeDrawing = function() {
    console.log('body size : ' + jqueryMap.$body.width() + ' * ' + jqueryMap.$body.height());
    
    // Video의 비율 계산
    stateMap.video.width = jqueryMap.$video.get(0).videoWidth;
    stateMap.video.height = jqueryMap.$video.get(0).videoHeight;
    stateMap.video.ratio = stateMap.video.width / stateMap.video.height;

    // Canvas 그리는 영역 계산
    calculateSizeCanvas();
    
    // Canvas 와 동일하게 Video 위치 설정
    jqueryMap.$video.get(0).style.top = stateMap.canvas_rect.top;
    jqueryMap.$video.get(0).style.left = stateMap.canvas_rect.left;
    jqueryMap.$video.get(0).width = stateMap.canvas_rect.width;
    jqueryMap.$video.get(0).height = stateMap.canvas_rect.height;

    // 가이드 라인 계산
    calculateSizeGuideLine();
  };

  calculateSizeCanvas = function() {
    var video = stateMap.video;
    var canvasWidth = 0;
    var canvasHeight = 0;

    var elem_body = jqueryMap.$body.get(0);

    var w_ratio = elem_body.clientWidth / video.width;
    var h_ratio = elem_body.clientHeight / video.height;

    if (w_ratio < h_ratio) {
      canvasWidth = elem_body.clientWidth;
      canvasHeight = elem_body.clientWidth / video.ratio;
    } 
    else {
      canvasHeight = elem_body.clientHeight;
      canvasWidth = elem_body.clientHeight * video.ratio;
    }
    stateMap.canvas_rect.left = (elem_body.clientWidth - canvasWidth) / 2 + 'px';
    stateMap.canvas_rect.top = (elem_body.clientHeight - canvasHeight) / 2 + 'px';
    stateMap.canvas_rect.width = canvasWidth;
    stateMap.canvas_rect.height = canvasHeight;

    jqueryMap.$canvas.get(0).style.left = stateMap.canvas_rect.left;
    jqueryMap.$canvas.get(0).style.top = stateMap.canvas_rect.top;
    jqueryMap.$canvas.get(0).width = stateMap.canvas_rect.width;
    jqueryMap.$canvas.get(0).height = stateMap.canvas_rect.height;
    console.log('body size : ' + elem_body.clientWidth + ' * ' + elem_body.clientHeight + ', canvas size : ' + canvasWidth + ' * ' + canvasHeight);
  };

  calculateSizeGuideLine = function() {
    var canvasWidth = stateMap.canvas_rect.width;
    var canvasHeight = stateMap.canvas_rect.height;
    var guide_line_rect = stateMap.guide_line_rect;
    if (stateMap.video.ratio < configMap.guide_line.ratio) {
      if (stateMap.video.ratio >= 1) {
      guide_line_rect.left = canvasWidth * configMap.guide_line.min_margin_percent;
      guide_line_rect.width = canvasWidth - (guide_line_rect.left * 2);
      guide_line_rect.height = guide_line_rect.width / configMap.guide_line.ratio;
      guide_line_rect.top = (canvasHeight - guide_line_rect.height) / 2;
    } else {
        // 세로 화면에서 가로 촬영을 유도하기 위한 가이드라인
        guide_line_rect.top = canvasHeight * configMap.guide_line.min_margin_percent;
        guide_line_rect.height = canvasHeight - (guide_line_rect.top * 2);
        guide_line_rect.width = guide_line_rect.height / configMap.guide_line.ratio;
        guide_line_rect.left = (canvasWidth - guide_line_rect.width) / 2;
      }
    } else {
      if(stateMap.video.ratio >= 1) {
        guide_line_rect.top = canvasHeight * configMap.guide_line.min_margin_percent;
        guide_line_rect.height = canvasHeight - (guide_line_rect.top * 2);
        guide_line_rect.width = guide_line_rect.height * configMap.guide_line.ratio;
        guide_line_rect.left = (canvasWidth - guide_line_rect.width) / 2;
      } else {
          guide_line_rect.left = canvasWidth * configMap.guide_line.min_margin_percent;
          guide_line_rect.width = canvasWidth - (guide_line_rect.left * 2);
          guide_line_rect.height = guide_line_rect.width * configMap.guide_line.ratio;
          guide_line_rect.top = (canvasHeight - guide_line_rect.height) / 2;
      }
    }
    console.log('guide line (left, top, width, height): (' + guide_line_rect.left + ',' + guide_line_rect.top + ',' + 
      guide_line_rect.width + ',' + guide_line_rect.height + ')');
  };

  startVideo = function( stream ) {
    if (stream) {
      if (jqueryMap.$video.get(0).srcObject !== undefined) {
        jqueryMap.$video.get(0).srcObject = stream;
      }
      else {
        jqueryMap.$video.get(0).src = URL.createObjectURL( stream );
      }
      jqueryMap.$video.get(0).play();
    }
    else {
      // 에러
      handleError( makeError('Start video fail', 'No stream exist'));
    }
  };

  stopVideo = function() {
    jqueryMap.$video.get(0).pause();
    if (jqueryMap.$video.get(0).srcObject) {
      jqueryMap.$video.get(0).srcObject.getTracks().forEach( function( track ) {
        if( track.readyState == 'live' ) {
          track.stop();
        }
      });
      jqueryMap.$video.get(0).srcObject = null;
    } else {
      if (jqueryMap.$video.get(0).src) {
        URL.revokeObjectURL( jqueryMap.$video.get(0).src );
      }
      jqueryMap.$video.get(0).src = null;
    }
    stateMap.video.width = stateMap.video.height = stateMap.video.ratio = 0;
  };

  /**
   * 가져온 Video Stream의 frame rate을 기준으로 
   * Canvas 를 그리는 timeout을 계산하고
   * configMap.draw_timeout 에 저장
   */
  getDrawingTimeout = function( stream ) {
    if (stream.getVideoTracks()) {
      stream.getVideoTracks().forEach( function(track, idx, arr) {
        if (track.enabled) {
          configMap.draw_timeout = parseInt( 1000 / track.getSettings().frameRate );
        }
      });
    }
  };

  drawCameraCanvas = function() {
    var video = jqueryMap.$video.get(0);
    if (video.paused || video.ended) {
      return;
    }
    
    // calculateSizeDrawing();
    // 비디오를 canvas에 그림  // 비디오 자체를 그냥 표시하기 위해 주석처리
    // drawVideo();
    // 카메라 사용시 스크롤 차단
    $('html, body').scrollTop(0);
    // canvas에 불투명 layer 추가
    drawLayer();

    // canvas에 가이드 라인 그림
    drawGuideLine();
    
    // 재귀호출 (일정 시간 기준으로 다시 그려줌)
    /*
    setTimeout( function() {
      window.requestAnimationFrame( function() {
        drawCameraCanvas.call();
      });
    }, configMap.draw_timeout);
    */
  };

  drawVideo = function() {
    var video = jqueryMap.$video.get(0);
    var canvas_2d_context = jqueryMap.$canvas.get(0).getContext('2d');
    canvas_2d_context.drawImage( video, 0, 0, stateMap.canvas_rect.width, stateMap.canvas_rect.height );
  };

  drawGuideLine = function() {
    var guide_rect = stateMap.guide_line_rect;
    var canvas_2d_context = jqueryMap.$canvas.get(0).getContext('2d');
    var guide_length = 30;
    canvas_2d_context.strokeStyle="white";
    canvas_2d_context.lineWidth=5;
    
    canvas_2d_context.beginPath();
    
    canvas_2d_context.moveTo(guide_rect.left, guide_rect.top + guide_length);
    canvas_2d_context.lineTo(guide_rect.left, guide_rect.top);
    canvas_2d_context.lineTo(guide_rect.left + guide_length, guide_rect.top);
    
    canvas_2d_context.moveTo(guide_rect.left + guide_rect.width - guide_length, guide_rect.top);
    canvas_2d_context.lineTo(guide_rect.left + guide_rect.width, guide_rect.top);
    canvas_2d_context.lineTo(guide_rect.left + guide_rect.width, guide_rect.top + guide_length);
    
    canvas_2d_context.moveTo(guide_rect.left, guide_rect.top + guide_rect.height - guide_length);
    canvas_2d_context.lineTo(guide_rect.left, guide_rect.top + guide_rect.height);
    canvas_2d_context.lineTo(guide_rect.left + guide_length, guide_rect.top + guide_rect.height);

    canvas_2d_context.moveTo(guide_rect.left + guide_rect.width, guide_rect.top + guide_rect.height - guide_length);
    canvas_2d_context.lineTo(guide_rect.left + guide_rect.width, guide_rect.top + guide_rect.height);
    canvas_2d_context.lineTo(guide_rect.left + guide_rect.width - guide_length, guide_rect.top + guide_rect.height);
    canvas_2d_context.moveTo(guide_rect.left + guide_rect.width, guide_rect.top + guide_rect.height);
    
    canvas_2d_context.closePath();
    
    canvas_2d_context.stroke();
    //canvas_2d_context.strokeRect(guide_rect.left, guide_rect.top, guide_rect.width, guide_rect.height);
  };
  
  drawLayer = function() {
	var guide_rect = stateMap.guide_line_rect;
	var canvas_2d_context = jqueryMap.$canvas.get(0).getContext('2d');
    var canvasWidth = stateMap.canvas_rect.width;
    var canvasHeight = stateMap.canvas_rect.height;
	
    canvas_2d_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
	canvas_2d_context.fillRect(0, 0, canvasWidth+100, canvasHeight + 100);
	canvas_2d_context.clearRect(guide_rect.left, guide_rect.top, guide_rect.width, guide_rect.height);
  }

  handleError = function( error ) {
    stateMap.image_data.reset();
    
    // 상태 변경
    if ( stateMap.state === MODULE_STATE.READY_CAPTURE ||
      stateMap.state === MODULE_STATE.CAPTURING ) {
      endTakingPhoto();
      setState( MODULE_STATE.READY_CAPTURE );
    } 
    else if ( stateMap.state === MODULE_STATE.NOT_INIT ||
      stateMap.state === MODULE_STATE.INITIALIZING ) {
      setState( MODULE_STATE.NOT_INIT );
    }
    else {
      setState( MODULE_STATE.NOT_INIT );
    }

    if (callbackMap.error) {
      callbackMap.error( error );
    } else {
      throw error;
    }
  };

  makeError = function( name, message ) {
    return inzicamera.util.common.makeError( name, message );
  };

  start = function( callback_function ) {

    if (callback_function) {
      callbackMap.start = callback_function;
    }
    startTakingPhoto();
  };

  stop = function( callback_function ) {
    stateMap.image_data.reset();

    if (callback_function) {
      callbackMap.stop = callback_function;
    }
    endTakingPhoto();
  };

  show = function( callback_function ) {
    // 창 크기 변환 시 이벤트 추가
    window.addEventListener( 'resize', onResizeWindow );
    window.addEventListener( 'orientationchange', onResizeWindow );

    // 촬영 화면 표시
    jqueryMap.$container.show();
  };

  hide = function() {
	// 창 크기 변환 시 이벤트 삭제
    window.removeEventListener( 'resize', onResizeWindow );
    window.removeEventListener( 'orientationchange', onResizeWindow );
	
    // 숨김
    jqueryMap.$container.hide();
  };

  return { 
    initModule: initModule,
    getName: getName,
    getHtmlComponent: getHtmlComponent,
    canSupport: canSupport,
    startTakingPhoto: startTakingPhoto,
    
    start: start,
    stop: stop,
    show: show,
    hide: hide,
    setCallback: setCallback,
  };
})();