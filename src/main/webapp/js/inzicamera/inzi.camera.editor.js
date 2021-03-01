/**
 * 결과 수정 화면
 * 
 */
inzicamera.editor = (function($) {
  var 
    configMap = {
      module_name : 'editor',
      html_component : {
        header : [],
        body: [
          ' <div class="izcamera-body-editor" >',
          '   <canvas class="izcamera-body-editor-canvas-layer"></canvas>',
          '   <canvas class="izcamera-body-editor-canvas-work"></canvas>',
          '   <img class="izcamera-body-editor-img"></img>',
          ' </div>'
        ],
        footer: [
          ' <div class="izcamera-footer-editor" >',
          '   <div class="izcamera-footer-editor-upside" >',
          '     <div class="izcamera-footer-editor-upside-button button">',
          '      <button class="izcamera-footer-editor-upside-button-crop-do" type="button">',
          '        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16825d" width="36px" height="36px">',
          '          <path d="M0 0h24v24H0V0z" fill="none"/>',
          '          <path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/>',
          '        </svg>',
          '      </button>',
          '      <button class="izcamera-footer-editor-upside-button-crop-undo" type="button">',
          '        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16825d" width="36px" height="36px">',
          '          <path d="M0 0h24v24H0z" fill="none"/>',
          '          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>',
          '        </svg>',
          '      </button>',
          '     </div>',
          '   </div>',
          '   <div class="izcamera-footer-editor-downside" >',
          '     <button class="izcamera-footer-editor-downside-button-left button" type="button">확인</button>',
          '     <button class="izcamera-footer-editor-downside-button-right button" type="button">재촬영</button>',
          '   </div>',
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
      },
      work_canvas : {
        relative_width: 0,
        relative_height: 0,
        absolute_width: 0,
        absolute_height: 0,
      },
      crop : {
        draw : true,
        edges : [  // drag: 드래그 여부, s_*: edge_point 시작점
            {
              idx: 0,
              x: 0, y: 0, s_x: 0, s_y: 0, drag: false, 
              neighbor: { left: null, right: 1, top: null, bottom: 3 }
            },
            {
              idx: 1,
              x: 0, y: 0, s_x: 0, s_y: 0, drag: false, 
              neighbor: { left: 0, right: null, top: null, bottom: 2 }
            },
            {
              idx: 2,
              x: 0, y: 0, s_x: 0, s_y: 0, drag: false, 
              neighbor: { left: 3, right: null, top: 1, bottom: null }
            },
            {
              idx: 3,
              x: 0, y: 0, s_x: 0, s_y: 0, drag: false, 
              neighbor: { left: null, right: 2, top: 0, bottom: null }
            },
        ],
        point_width: 10,
        canvas : {
          width: 0,
          height: 0,
        },
        touch : [
          {
            x: 0,
            y: 0,
          }
        ],
        enable_perspective : false,
       },
    },
    jqueryMap = {
    },
    callbackMap = {
      error: undefined,
      ok: undefined,
      cancel: undefined,
    },
    
    initModule,
    setJqueryMap,
    getName,
    getHtmlComponent,
    bindEvent,
    setCallback,

    initWebglCanvas,

    calcImageSizeAndPos,
    calcImageSize,
    calcImagePosition,
    calcEdgePosition,

    loadImage,

    onloadImg,
    onerrorImg,
    onclickOk,
    onclickCancel,
    
    onclickCrop,
    onresizeWindow,

    crop,
    cropUndo,

    execute,
    handleError,

    drawLayerCanvas,
    drawCropEdge,
    drawCropPoint
    ;

  initModule = function($container) {
    stateMap.$container = $container;

    setJqueryMap();

    initWebglCanvas();

    bindEvent();
  };
  
  initWebglCanvas = function() {
    // try to create a WebGL canvas (will fail if WebGL isn't supported)
    try {
      stateMap.fx_canvas = fx.canvas();
      if (jqueryMap.$canvas_work) {
        jqueryMap.$canvas_work.remove();
        jqueryMap.$canvas_layer.after(stateMap.fx_canvas);
        jqueryMap.$canvas_work = $(stateMap.fx_canvas);
      }
      stateMap.crop.enable_perspective = true;
    } catch (e) {
      stateMap.fx_canvas = null;
      console.log(e);
    }
  };

  setJqueryMap = function() {
    var $container = stateMap.$container;
    jqueryMap = { 
      $container : $container,
      $body : $container.find('.izcamera-body-editor'),
      $canvas_layer : $container.find('.izcamera-body-editor-canvas-layer'),
      $canvas_work : $container.find('.izcamera-body-editor-canvas-work'),
      $img : $container.find('.izcamera-body-editor-img'),
      $footer: $container.find('.izcamera-footer-editor'),
      $select: $container.find('.izcamera-footer-editor-upside-select'),
      $button_apply : $container.find('.izcamera-footer-editor-upside-button-left'),
      $button_ok : $container.find('.izcamera-footer-editor-downside-button-left'),
      $button_cancel : $container.find('.izcamera-footer-editor-downside-button-right'),
      $button_crop_do : $container.find('.izcamera-footer-editor-upside-button-crop-do'),
      $button_crop_undo : $container.find('.izcamera-footer-editor-upside-button-crop-undo'),
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
    
    jqueryMap.$canvas_layer.on( 'touchstart', ontouchstartCanvas );
    jqueryMap.$canvas_layer.on( 'touchend', ontouchendCanvas );
    jqueryMap.$canvas_layer.on( 'touchcancel', ontouchcancelCanvas );
    jqueryMap.$canvas_layer.on( 'touchmove', ontouchmoveCanvas );

    jqueryMap.$button_crop_do.on( 'click', onclickCrop );
    jqueryMap.$button_crop_undo.on( 'click', onclickCrop );
  };

  calcImageSizeAndPos = function() {
    // Layer 캔버스는 실제 화면 Body 크기와 동일하게 설정
    var elem_canvas_layer = jqueryMap.$canvas_layer.get(0);
    setElementSize(elem_canvas_layer, jqueryMap.$img.get(0).naturalWidth, jqueryMap.$img.get(0).naturalHeight);

    calcEdgePosition();
  };

  setElementSize = function(html_element, elem_width, elem_height) {
    var elem_ratio = elem_width / elem_height;

    var elem_body = jqueryMap.$body.get(0);
    var w_ratio = elem_body.clientWidth / elem_width;
    var h_ratio = elem_body.clientHeight / elem_height;

    if (w_ratio < h_ratio) {
      html_element.width = elem_body.clientWidth;
      html_element.height = elem_body.clientWidth / elem_ratio;
    } 
    else {
      html_element.height = elem_body.clientHeight;
      html_element.width = elem_body.clientHeight * elem_ratio;
    }

    var margin_width = elem_body.clientWidth - html_element.width;
    var margin_x = 0;
    if (margin_width > 0) {
      margin_x = margin_width / 2;
    }
    var margin_height = elem_body.clientHeight - html_element.height;
    var margin_y = 0;
    if (margin_height > 0) {
      margin_y = margin_height / 2;
    }
    html_element.style.margin = margin_y + 'px ' + margin_x + 'px';
  };

  drawWorkCanvas = function(target_elem) {
    // 생성된 Canvas에 그리려고 하였으나 내부적으로 사이즈 조절이 되지 않는 버그가 있어 새로 생성
    initWebglCanvas();

    var elem_wcanvas = jqueryMap.$canvas_work.get(0);
    elem_wcanvas.width = target_elem.width;
    elem_wcanvas.height = target_elem.height;
    if (stateMap.fx_canvas) {
      if (stateMap.texture) {
        stateMap.texture.destroy();
      }
      stateMap.texture = stateMap.fx_canvas.texture(target_elem);
      stateMap.fx_canvas.draw(stateMap.texture, elem_wcanvas.width, elem_wcanvas.height);
      stateMap.fx_canvas.update();
    }
    else {
      var context = elem_wcanvas.getContext('2d');
      context.drawImage(target_elem, 0, 0, elem_wcanvas.width, elem_wcanvas.height);
    }

    setStyleWorkCanvas();
  };

  /**
   * Work Canvas의 실제 크기는 이미지와 동일하게 하고
   * style로 크기를 조절한다
   */
  setStyleWorkCanvas = function() {
    var elem_wcanvas = jqueryMap.$canvas_work.get(0);
    var wcanvas_width = elem_wcanvas.width;
    var wcanvas_height = elem_wcanvas.height;

    var wcanvas_ratio = wcanvas_width / wcanvas_height;

    var elem_body = jqueryMap.$body.get(0);
    var w_ratio = elem_body.clientWidth / wcanvas_width;
    var h_ratio = elem_body.clientHeight / wcanvas_height;

    var style_w = 0;
    var style_h = 0;
    if (w_ratio < h_ratio) {
      style_w = elem_body.clientWidth;
      style_h = elem_body.clientWidth / wcanvas_ratio;
    } 
    else {
      style_h = elem_body.clientHeight;
      style_w = elem_body.clientHeight * wcanvas_ratio;
    }

    var margin_width = elem_body.clientWidth - style_w;
    var margin_x = 0;
    if (margin_width > 0) {
      margin_x = margin_width / 2;
    }
    var margin_height = elem_body.clientHeight - style_h;
    var margin_y = 0;
    if (margin_height > 0) {
      margin_y = margin_height / 2;
    }
    elem_wcanvas.style.width = style_w + 'px';
    elem_wcanvas.style.height = style_h + 'px';
    elem_wcanvas.style.margin = margin_y + 'px ' + margin_x + 'px';
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

  /**
   * Resize 시 변경된 캔버스 크기에 따라 Crop 꼭지점 계산
   */
  calcEdgePosition = function() {
    var o_canvas_w = stateMap.crop.canvas.width;
    var o_canvas_h = stateMap.crop.canvas.height;
    var n_canvas_w = jqueryMap.$canvas_layer.get(0).width;
    var n_canvas_h = jqueryMap.$canvas_layer.get(0).height;
    var canvas_changed = false;
    var ratio_x = 1;
    var ratio_y = 1;
    if (o_canvas_w && o_canvas_w != n_canvas_w) {
      canvas_changed = true;
      ratio_x = n_canvas_w / o_canvas_w;
    }
    if (o_canvas_h && o_canvas_h != n_canvas_h) {
      canvas_changed = true;
      ratio_y = n_canvas_h / o_canvas_h;
    }
    if (canvas_changed) {
      for (var key in stateMap.crop.edges) {
        var edge_point = stateMap.crop.edges[key];
        edge_point.x = edge_point.x * ratio_x;
        edge_point.y = edge_point.y * ratio_y;
      }
    }
    stateMap.crop.canvas.width = n_canvas_w;
    stateMap.crop.canvas.height = n_canvas_h;
  };

  /**
   * src_elem 의 가운데 위치하도록 target_elem Style 설정
   * width, height, margin 으로 조절
   */
  setResultCanvasStyle = function(canvas_width, canvas_height) {
    var target_elem = jqueryMap.$canvas_work.get(0);
    var target_width = canvas_width? canvas_width: target_elem.width;
    var target_height = canvas_height? canvas_height: target_elem.height;
    var target_ratio = target_width / target_height;

    var elem_body = jqueryMap.$body.get(0);

    var w_ratio = elem_body.clientWidth / target_width;
    var h_ratio = elem_body.clientHeight / target_height;
    var style_width = 0;
    var style_height = 0;
    if (w_ratio < h_ratio) {
      style_width = elem_body.clientWidth;
      style_height = (elem_body.clientWidth / target_ratio);
    } 
    else {
      style_height = elem_body.clientHeight;
      style_width = (elem_body.clientHeight * target_ratio);
    }

    var margin_x = (elem_body.clientWidth - style_width) / 2;
    var margin_y = (elem_body.clientHeight - style_height) / 2;
    target_elem.style.width = style_width + 'px';
    target_elem.style.height = style_height + 'px';
    target_elem.style.margin = margin_y + 'px ' + margin_x + 'px';
  };

  onloadImg = function(event) {
    URL.revokeObjectURL(event.target.src);
    jqueryMap.$img.hide();

    var elem_img = jqueryMap.$img.get(0);
    elem_img.width = elem_img.naturalWidth;
    elem_img.height = elem_img.naturalHeight;

    jqueryMap.$canvas_work.show();
    jqueryMap.$container.show();

    calcImageSizeAndPos();

    // 가이드라인을 Image 사이즈 기준에서 Canvas 사이즈로 변환
    var ratio_x = jqueryMap.$canvas_layer.get(0).width / jqueryMap.$img.get(0).naturalWidth;
    var ratio_y = jqueryMap.$canvas_layer.get(0).height / jqueryMap.$img.get(0).naturalHeight;
    
    var guide_rect = stateMap.image_data.guide_rect;
    stateMap.crop.edges[0].x = guide_rect.left * ratio_x;
    stateMap.crop.edges[0].y = guide_rect.top * ratio_y;
    stateMap.crop.edges[1].x = (guide_rect.left + guide_rect.width) * ratio_x;
    stateMap.crop.edges[1].y = guide_rect.top * ratio_y;
    stateMap.crop.edges[2].x = (guide_rect.left + guide_rect.width) * ratio_x;
    stateMap.crop.edges[2].y = (guide_rect.top + guide_rect.height) * ratio_y;
    stateMap.crop.edges[3].x = guide_rect.left * ratio_x;
    stateMap.crop.edges[3].y = (guide_rect.top + guide_rect.height) * ratio_y;

    drawLayerCanvas();
    drawWorkCanvas(jqueryMap.$img.get(0));
  };

  onerrorImg = function($error) {
    if ($error.type === 'error') {
      handleError('editor image load failed');
    }
  };

  onclickOk = function(event) {
    if (stateMap.image_data) {
      if (callbackMap.ok) {
        var canvas_elem = jqueryMap.$canvas_work.get(0);
        if (stateMap.fx_canvas) {
          canvas_elem = getCanvasFromFxCanvas();
        }
        var data_url = canvas_elem.toDataURL( 'image/jpeg', 1.0 );
        stateMap.image_data.blob = inzicamera.util.image.converter.dataUrltoBlob( data_url );
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

  getCanvasFromFxCanvas = function(result_width, result_height) {
    var gl = stateMap.fx_canvas._.gl;
    var fx_texture = stateMap.fx_canvas.contents();

    var texture = fx_texture._.id;

    var width = fx_texture._.width;
    var height = fx_texture._.height;
    
    if ( !result_width) {
      result_width = width;
    }
    if ( !result_height) {
      result_height = height;
    }

    // Create a framebuffer backed by the texture
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0 );

    // Read the contents of the framebuffer
    var data = new Uint8Array( width * height * 4 );
    gl.readPixels( 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data );

    gl.deleteFramebuffer( framebuffer );

    // Create a 2D canvas to store the result 
    var canvas = document.createElement('canvas');
    canvas.width = result_width;
    canvas.height = result_height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData( width, height );
    imageData.data.set( data );
    context.putImageData( imageData, 0, 0, 0, 0, result_width, result_height );

    return canvas;
  };
  
  onclickCrop = function(event) {
    var target = event.currentTarget;
    if (target == jqueryMap.$button_crop_do.get(0)) {
      crop();
    } 
    else if (target == jqueryMap.$button_crop_undo.get(0)){
      cropUndo();
    }
  };

  onresizeWindow = function(event) {
    calcImageSizeAndPos();
    drawLayerCanvas();
    setStyleWorkCanvas();
  };

  crop = function() {
    var target_w = stateMap.crop.edges[1].x - stateMap.crop.edges[0].x;
    var target_h = stateMap.crop.edges[3].y - stateMap.crop.edges[0].y;
    var ratio_x = jqueryMap.$img.get(0).naturalWidth / jqueryMap.$canvas_layer.width();
    var ratio_y = jqueryMap.$img.get(0).naturalHeight / jqueryMap.$canvas_layer.height();

    if (stateMap.fx_canvas) {
      var top_w = stateMap.crop.edges[1].x - stateMap.crop.edges[0].x;
      var bottom_w = stateMap.crop.edges[2].x - stateMap.crop.edges[3].x;
      var left_h = stateMap.crop.edges[3].y - stateMap.crop.edges[0].y;
      var right_h = stateMap.crop.edges[2].y - stateMap.crop.edges[1].y;
      target_w = top_w > bottom_w ? top_w : bottom_w;
      target_h = left_h > right_h ? left_h : right_h;
      
      // Convert to Image ratio
      target_w = target_w * ratio_x;
      target_h = target_h * ratio_y;
      if (target_w > target_h) {
        target_h = target_w / 1.5858;
      }
      else {
        target_w = target_h / 1.5858;
      }
      stateMap.fx_canvas.perspective(
        [ // Before
          stateMap.crop.edges[0].x * ratio_x, stateMap.crop.edges[0].y * ratio_y, // left-top
          stateMap.crop.edges[1].x * ratio_x, stateMap.crop.edges[1].y * ratio_y, // right-top
          stateMap.crop.edges[3].x * ratio_x, stateMap.crop.edges[3].y * ratio_y, // left-bottom
          stateMap.crop.edges[2].x * ratio_x, stateMap.crop.edges[2].y * ratio_y  // right-bottom
        ],
        [ // After
          // 0, 0, 
          // jqueryMap.$canvas_work.get(0).width, 0, 
          // 0, jqueryMap.$canvas_work.get(0).height, 
          // jqueryMap.$canvas_work.get(0).width, jqueryMap.$canvas_work.get(0).height 
          0, 0,
          target_w, 0,
          0, target_h,
          target_w, target_h
        ] 
        );
      stateMap.fx_canvas.update();

      drawWorkCanvas(getCanvasFromFxCanvas(target_w, target_h));
    }
    else {
      target_w = target_w * ratio_x;
      target_h = target_h * ratio_y;

      var sx = stateMap.crop.edges[0].x * ratio_x;
      var sy = stateMap.crop.edges[0].y * ratio_y;

      var result_canvas = jqueryMap.$canvas_work.get(0);
      result_canvas.width = target_w;
      result_canvas.height = target_h;
      var context = result_canvas.getContext('2d');
      context.drawImage(jqueryMap.$img.get(0), sx, sy, target_w, target_h, 0, 0, target_w, target_h);

      // calcResultCanvasPosition();
      setStyleWorkCanvas();
    }

    jqueryMap.$canvas_layer.hide();
    jqueryMap.$button_crop_do.hide();
    jqueryMap.$button_crop_undo.show();
    
    stateMap.image_data.cropped = true;
  };

  cropUndo = function() {
    drawWorkCanvas(jqueryMap.$img.get(0));

    jqueryMap.$canvas_layer.show();
    jqueryMap.$button_crop_do.show();
    jqueryMap.$button_crop_undo.hide();
    
    stateMap.image_data.cropped = false;
  };

  ontouchstartCanvas = function(event) {
    event.preventDefault();
    // 터치지점이 edge_point와 동일하면 drag 상태로 변경
    var is_changed = false;
    console.log('touchstart canvas length(' + event.changedTouches.length + '): ' + event.changedTouches[0].clientX + ', ' + event.changedTouches[0].clientY + ')');
    var touch_point = event.changedTouches[0];
    var relative_touch_x = touch_point.clientX - jqueryMap.$canvas_layer.offset().left;
    var relative_touch_y = touch_point.clientY - jqueryMap.$canvas_layer.offset().top;

    // ** CASE 1: 화면 상 꼭지점을 터치해야 선택되는 루틴
    // for (var key in stateMap.crop.edges) {
    //   var edge_point = stateMap.crop.edges[key];
    //   // touch 위치는 View 포트 기반이므로 Canvas의 상대 위치로 변환
    //   var is_touch = isTouchEdge( edge_point, stateMap.crop.point_width, relative_touch_x, relative_touch_y );
    //   if (is_touch) {
    //     edge_point.drag = true;
    //     edge_point.s_x = edge_point.x;
    //     edge_point.s_y = edge_point.y;
    //     stateMap.crop.touch[0].x = relative_touch_x;
    //     stateMap.crop.touch[0].y = relative_touch_y;
    //     is_changed = true;
    //     break;  // Touch Point 하나만 선택되도록 예외처리
    //   }
    // }

    // ** CASE 2: 실제 꼭지점을 터치하여 드래그하기 어려울 수 있어서 
    // Canvas를 나눠서 해당 지점을 터치하면 터치된 위치에 따라 해당 방향의 꼭지점이 선택되도록 함 
    var edge_point = getEdgeWithTouchPosition( {x: relative_touch_x, y: relative_touch_y} );
    if (edge_point) {
      is_changed = true;
      edge_point.drag = true;
      stateMap.crop.touch[0].x = relative_touch_x;
      stateMap.crop.touch[0].y = relative_touch_y;
      is_changed = true;
      // 모든 포인트에 s_x를 모두 업데이트 해주자
      for (var key in stateMap.crop.edges) {
        stateMap.crop.edges[key].s_x = stateMap.crop.edges[key].x;
        stateMap.crop.edges[key].s_y = stateMap.crop.edges[key].y;
      }
    }
    if (is_changed) {
      drawLayerCanvas();
    }
  };

  ontouchendCanvas = function(event) {
    console.log('touchend canvas length(' + event.changedTouches.length + '): ' + event.changedTouches[0].clientX + ', ' + event.changedTouches[0].clientY + ')');
    event.preventDefault();
    // edge_point 중에 drag 인 포인터가 있으면 drag 해제
    var is_changed = false;
    for (var key in stateMap.crop.edges) {
      if (stateMap.crop.edges[key].drag) {
        stateMap.crop.edges[key].drag = false;
        is_changed = true;
      }
    }
    if (is_changed) {
      drawLayerCanvas();
    }
  };

  ontouchcancelCanvas = function(event) {
    console.log('touchcancel canvas length(' + event.changedTouches.length + '): ' + event.changedTouches[0].clientX + ', ' + event.changedTouches[0].clientY + ')');
    event.preventDefault();
    // edge_point 중에 drag 인 포인터가 있으면 다시 시작 값으로 되돌리고 drag 해제
    var is_changed = false;
    for (var key in stateMap.crop.edges) {
      var edge_point = stateMap.crop.edges[key];
      if (edge_point.drag) {
        edge_point.drag = false;
        edge_point.x = edge_point.s_x;
        edge_point.y = edge_point.s_y;
        is_changed = true;
      }
    }
    if (is_changed) {
      drawLayerCanvas();
    }
  };

  ontouchmoveCanvas = function(event) {
    // console.log('touchmove canvas length(' + event.changedTouches.length + '): ' + event.changedTouches[0].clientX + ', ' + event.changedTouches[0].clientY + ')');
    event.preventDefault();
    // edge_point 중에 drag 인 포인터가 있으면 현재 위치를 포인터 위치로 반영
    var is_changed = false;
    for (var key in stateMap.crop.edges) {
      var edge_point = stateMap.crop.edges[key];
      if (edge_point.drag) {
        var touch_point = event.changedTouches[0];
        // touch 위치는 View 포트 기반이므로 Canvas의 상대 위치로 변환
        var relative_touch_x = touch_point.clientX - jqueryMap.$canvas_layer.offset().left;
        var relative_touch_y = touch_point.clientY - jqueryMap.$canvas_layer.offset().top;
        var touch_moved_x = relative_touch_x - stateMap.crop.touch[0].x;
        var touch_moved_y = relative_touch_y - stateMap.crop.touch[0].y;
        // 원래 위치와의 차이만큼 이동하도록 함
        // 가로, 세로 많이 움직인 쪽으로만 움직이도록 함
        moveEdges(edge_point, touch_moved_x, touch_moved_y);
        is_changed = true;
      }
    }
    if (is_changed) {
      drawLayerCanvas();
    }
  };

  moveEdges = function(edge_point, touch_moved_x, touch_moved_y) {
    moveEdge(edge_point, touch_moved_x, touch_moved_y);
    // webGl 지원하지 않을 경우 사각형을 유지
    if (!stateMap.crop.enable_perspective) {
      if(edge_point.neighbor.left != null) {
        moveEdge(stateMap.crop.edges[edge_point.neighbor.left], 0, touch_moved_y);
      }
      if(edge_point.neighbor.right != null) {
        moveEdge(stateMap.crop.edges[edge_point.neighbor.right], 0, touch_moved_y);
      }
      if(edge_point.neighbor.top != null) {
        moveEdge(stateMap.crop.edges[edge_point.neighbor.top], touch_moved_x, 0);
      }
      if(edge_point.neighbor.bottom != null) {
        moveEdge(stateMap.crop.edges[edge_point.neighbor.bottom], touch_moved_x, 0);
      }
    }
  };
  
  moveEdge = function(edge_point, move_x, move_y) {
    // 미리 설정된 범위를 벗어나지 않도록 터치 위치 조정
    var permitted_area = getEdgePointBoundary(edge_point.idx);
    var adjusted_point = getAdjustedPointToInsideBoundary(permitted_area, edge_point.s_x + move_x, edge_point.s_y + move_y);
    edge_point.x = adjusted_point.x;
    edge_point.y = adjusted_point.y;
  };

  isTouchEdge = function(edge_point, boundary_length, touch_x, touch_y) {
    return isTouchObject( 
      {
        left: edge_point.x - boundary_length,
        right: edge_point.x + boundary_length,
        top: edge_point.y - boundary_length,
        bottom: edge_point.y + boundary_length,
      },
      {
        x: touch_x,
        y: touch_y,
      }
    );
  };

  isTouchObject = function(boundary, touch_point) {
    if (boundary.left > touch_point.x || boundary.right < touch_point.x) {
      return false;
    }
    if (boundary.top > touch_point.y || boundary.bottom < touch_point.y) {
      return false;
    }
    return true;
  };

  getEdgeWithTouchPosition = function(touch_point) {
    for (var key in stateMap.crop.edges) {
      var edge_point = stateMap.crop.edges[key];
      var boundary = getEdgePointBoundary(edge_point.idx);
      
      if (isTouchObject(boundary, touch_point)) {
        return edge_point;
      }
    }
    return null;
  };

  getAdjustedPointToInsideBoundary = function(permitted_area, touch_x, touch_y) {
    var adjusted = { x: touch_x, y: touch_y };
    if (touch_x < permitted_area.left) {
      adjusted.x = permitted_area.left;
    }
    if (touch_x > permitted_area.right) {
      adjusted.x = permitted_area.right;
    }
    if (touch_y < permitted_area.top) {
      adjusted.y = permitted_area.top;
    }
    if (touch_y > permitted_area.bottom) {
      adjusted.y = permitted_area.bottom;
    }
    return adjusted;
  };

  /**
   * EdgePoint가 움직일 수 있는 Canvas 내 경계 반환
   */
  getEdgePointBoundary = function(idx) {
    var canvas = jqueryMap.$canvas_layer.get(0);
    var margin = stateMap.crop.point_width / 2;
    var boundary = { 
      left: canvas.clientLeft + margin,
      top: canvas.clientTop + margin,
      right: canvas.width - margin, 
      bottom: canvas.height - margin 
    };
    switch (idx) {
      case 0:
        boundary.right = canvas.width / 2 - margin;
        boundary.bottom = canvas.height / 2 - margin;
        break;
      case 1:
        boundary.left = canvas.width / 2 + margin;
        boundary.bottom = canvas.height / 2 - margin;
        break;
      case 2:
        boundary.left = canvas.width / 2 + margin;
        boundary.top = canvas.height / 2 + margin;
        break;
      case 3:
        boundary.right = canvas.width / 2 - margin;
        boundary.top = canvas.height / 2 + margin;
        break;
      default:
        break;
    }
    return boundary;
  };

  drawLayerCanvas = function() {
    window.requestAnimationFrame( function() {
      var context = jqueryMap.$canvas_layer.get(0).getContext('2d');
      context.clearRect( 0, 0, jqueryMap.$canvas_layer.get(0).width, jqueryMap.$canvas_layer.get(0).height );

      if (stateMap.crop.draw) {
        drawCropEdge( context );
      }
    });
  };

  drawCropEdge = function(context) {
    context.beginPath();
    for (var key in stateMap.crop.edges) {
      drawCropPoint(context, stateMap.crop.edges[key], stateMap.crop.point_width);
      if (key === 0) {
        context.moveTo(stateMap.crop.edges[key].x, stateMap.crop.edges[key].y);
      } 
      else {
        context.lineTo(stateMap.crop.edges[key].x, stateMap.crop.edges[key].y);
      }
    }
    context.closePath();
    context.stroke();
  };

  drawCropPoint = function(context, edge_point, rect_width) {
    if (edge_point.drag == true) {
      context.fillRect(edge_point.x - rect_width, edge_point.y - rect_width,
        rect_width * 2, rect_width * 2);
    }
    else {
      context.strokeRect(edge_point.x - rect_width, edge_point.y - rect_width,
        rect_width * 2, rect_width * 2);
    }
  };

  /**
   * Editor 화면 표시
   * 
   * @param * image_data 이미지 데이터 구조체 stateMap.image_data 참고
   */
  execute = function( image_data ) {
    stateMap.image_data = image_data;
    loadImage( image_data.blob );
  };

  /**
   * 이미지 데이터를 Image 태그로 로드
   * 로드 완료 시 onloadImg 콜백
   * 실패 시 onErrorImg 콜백
   * 
   * @param {Blob} blob 이미지 데이터
   */
  loadImage = function( blob ) {
    try {
      var url = URL.createObjectURL(blob);
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
      error_obj = inzicamera.util.common.makeError('EDITOR_ERROR', error);
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
    
    window.addEventListener( 'resize', onresizeWindow );

    jqueryMap.$canvas_work.hide();
    jqueryMap.$canvas_layer.show();
    jqueryMap.$button_crop_do.show();
    jqueryMap.$button_crop_undo.hide();

    execute( image_data );
  };

  hide = function() {
    stateMap.image_data.reset();

    window.removeEventListener( 'resize', onresizeWindow );
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
