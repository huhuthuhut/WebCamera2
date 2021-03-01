inzicamera.util = (inzicamera.util? inzicamera.util: {});

inzicamera.util.image = (function($) {
  var 
    configMap = {
      
    },
    resize,
    onloadFileReaderResize, // 
    onloadImageResize
    ;

  /**
   * 이미지가 최대 너비 혹은 최대 높이보다 클 경우 
   * 긴 면을 기준으로 이미지 축소
   * 
   * @param {Blob} blob 이미지 데이터
   * @param {Number} max_width 최대 너비 픽셀
   * @param {Number} max_height 최대 높이 픽셀
   * @param {String} image_mime_type 이미지 mime 타입
   * @param {Number} image_quality 이미지 품질 0.00 ~ 1.00 ( image/jpeg, image/webp 에서만 적용 )
   * @returns {Promise} Promise 객체
   */
  resize = function( blob, max_width, max_height, image_mime_type, image_quality ) {
    var deferred = $.Deferred();
    try {
      var image = new Image();
      image.onload = function(event) {
        onloadImageResize( event, deferred, { 
          max_width: max_width,
          max_height: max_height,
          image_mime_type: image_mime_type,
          image_quality: image_quality,
         } );
      };

      var fileReader = new FileReader();
      fileReader.onload = function(event) {
        onloadFileReaderResize( event, deferred, image );
      };
      fileReader.readAsDataURL( blob );
    } 
    catch (error) {
      deferred.reject( error );
    }
    return deferred.promise();
  };

  onloadFileReaderResize = function(event, deferred, image) {
    try {
      image.name = event.target.name;
      image.size = event.target.size;
      image.src = event.target.result;
    }
    catch (error) {
      deferred.reject( error );
    }
  };

  onloadImageResize = function(event, deferred, resize_info) {
    try {
      var image_elem = event.target;
      var width = image_elem.width;
      var height = image_elem.height;
      var target_width;
      var target_height;

      var resize_ratio = calculateResizeRatio( width, height, resize_info.max_width, resize_info.max_height );
      if (resize_ratio < 1) {
        target_width = image_elem.width * resize_ratio;
        target_height = image_elem.height * resize_ratio;
      } else {
        target_width = width;
        target_height = height;
      }

      var $canvas = $('<canvas />');
      $canvas.get(0).width = target_width;
      $canvas.get(0).height = target_height;

      var canvas2dContext = $canvas.get(0).getContext('2d');
      canvas2dContext.drawImage( image_elem, 0, 0, target_width, target_height );

      console.log( '## resize image' );
      console.log( '## origin size: ' + width + ', ' + height);
      console.log( '## result size: ' + target_width + ', ' + target_height);
      var dataUrl = $canvas.get(0).toDataURL( resize_info.image_mime_type, resize_info.image_quality );
      deferred.resolve( inzicamera.util.image.converter.dataUrltoBlob( dataUrl ) );

      // toBlob IE, Chrome not supported
      // $canvas.toBlob( function(blob) {
      //   deferred.resolve( blob );
      // }, resize_info.image_mime_type, resize_info.image_quality);
    }
    catch (error) {
      deferred.reject( error );
    }
  };

  /**
   * 이미지 비율 계산
   * @param {Number} width 현재 너비
   * @param {Number} height 현재 높이
   * @param {Number} targetWidth 목표 너비
   * @param {Number} targetHeight 목표 높이
   * @returns {Number} 비율
   */
  calculateResizeRatio = function( width, height, target_width, target_height ) {
    if (( !target_width && !target_height) || 
        (target_width == 0 && target_height == 0)) {
      return 1;
    }
    var width_resize_ratio = 1;
    var height_resize_ratio = 1;
    if (target_width) {
      width_resize_ratio = target_width / width;
    }
    if (target_height) {
      height_resize_ratio = target_height / height;
    }
    return (width_resize_ratio < height_resize_ratio? width_resize_ratio: height_resize_ratio);
  };

  return {
    resize: resize,
  };
}( jQuery ));