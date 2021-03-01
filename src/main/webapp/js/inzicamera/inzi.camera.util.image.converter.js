inzicamera.util.image.converter = (function($) {
  var 
    configMap = {
      
    },
    dataUrltoBlob,
    blobToImage,
    imageDataToBlob
    ;
  /*
   * DataURL 형태의 데이터를 Blob으로 변환
   * 
   * @param {String} DataURL 
   * @returns {Blob} Blob 데이터
   */
  dataUrltoBlob = function( dataUrl ) {
    var byteString = atob(dataUrl.split(',')[1]);

    var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});
  };

  /**
   * ImageData 형태의 데이터를 Blob으로 변환
   * 
   * @param {ImageData} 이미지 ImageData, Canvas의 getImageData를 이용하여 추출
   * @returns {Blob} blob 데이터
   */
  imageDataToBlob = function(image_data) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = image_data.width;
    canvas.height = image_data.height;
    ctx.putImageData(image_data, 0, 0);

    return dataUrltoBlob( canvas.toDataURL( 'image/jpeg', 1.0 ) );
  };

  /**
   * blob 형태의 데이터를 Image 객체로 변환
   * 
   * @param {Blob} 이미지 blob 데이터
   * @param {Function} 이미지 변환 후 호출할 Callback 함수
   */
  blobToImage = function(blob, callback) {
    var url = window.URL.createObjectURL(blob);
    var image = new Image();
    image.onload = function() {
      window.URL.revokeObjectURL(url);
      callback( image );
    };
    image.src = url;
  };
  
  return {
    dataUrltoBlob: dataUrltoBlob,
    imageDataToBlob: imageDataToBlob,

    blobToImage: blobToImage,
  };
}( jQuery ));