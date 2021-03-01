inzicamera.util.image.filter = (function($) {
  var
    getFilterNames,

    grayscale,
    brightness,
    threshold,
    sharpen,
    blurC,
    sobel,

    apply
    ;

  grayscale = function(blob, callback) {
    return apply(Filters.grayscale, blob, callback);
  };

  brightness = function(blob, callback) {
    return apply(Filters.brightness, blob, callback, 40);
  };

  threshold = function(blob, callback) {
    return apply(Filters.threshold, blob, callback, 128);
  };

  sharpen = function(blob, callback) {
    return apply(Filters.convolute, blob, callback, 
      [ 0, -1,  0,
      -1,  5, -1,
        0, -1,  0]);
  };

  blurC = function(blob, callback) {
    return apply(Filters.convolute, blob, callback, 
      [ 1/9, 1/9, 1/9,
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9 ]);
  };
  
  sobel = function(blob, callback) {
    return apply(function(px) {
      px = Filters.grayscale(px);
      var vertical = Filters.convoluteFloat32(px,
        [-1,-2,-1,
          0, 0, 0,
          1, 2, 1]);
      var horizontal = Filters.convoluteFloat32(px,
        [-1,0,1,
        -2,0,2,
        -1,0,1]);
      var id = Filters.createImageData(vertical.width, vertical.height);
      for (var i=0; i<id.data.length; i+=4) {
        var v = Math.abs(vertical.data[i]);
        id.data[i] = v;
        var h = Math.abs(horizontal.data[i]);
        id.data[i+1] = h;
        id.data[i+2] = (v+h)/4;
        id.data[i+3] = 255;
      }
      return id;
    }, blob, callback);
  };

  apply = function(filter, blob, callback, arg1, arg2, arg3) {
    inzicamera.util.image.converter.blobToImage( blob, function( image ) {
      var image_data = Filters.filterImage( filter, image, arg1, arg2, arg3 );
      callback( inzicamera.util.image.converter.imageDataToBlob( image_data ) );
    });
  };
  
  getFilterNames = function() {
    return [
      'grayscale',
      'brightness',
      'threshold',
      'sharpen',
      'blurC',
      'sobel',
    ];
  };

  return {
    grayscale: grayscale,
    brightness: brightness,
    threshold: threshold,
    sharpen: sharpen,
    blurC: blurC,
    sobel: sobel,

    getFilterNames : getFilterNames,

    apply: apply,
  };
}( jQuery ));