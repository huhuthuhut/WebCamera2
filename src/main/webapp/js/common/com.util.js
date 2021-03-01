/**
 * 문자열을 정수로 변환
 * 
 * @param str	문자열
 * @returns	변환된 정수
 */
function toInt(str) {
    var n = null;
    try {
        n = parseInt(str, 10);
    } catch (e) {}
    return n;
}

function nullToDash(str) {
    return nullToDefault(str, "-");
}

function nullToDefault(str, defaultString) {
    return (str == null || str.length == 0 ? defaultString : str);
}

var ComUtils = (function() {
    function toInt(str) {
        var n = null;
        try {
            n = parseInt(str, 10);
        } catch (e) {}
        return n;
    }

    function nullToDefault(str, defaultString) {
        return (str == null || str.length == 0 ? defaultString : str);
    }

    function pageRowNumber(pageNo, pageSize, index, totalCount) {
        if (totalCount) {
            return totalCount - ((pageNo - 1) * pageSize + index);
        } else {
            return (pageNo - 1) * pageSize + (index + 1);
        }
    }
    
    function isEmpty(str) {
    	str = str || "";
    	return (str == null || str.length == 0);
    }
    
    function isEquals(str) {
    	str = str || "";
    	return (str == null || str.length == 0);
    }
    
    return {
        toInt: function() {
            return toInt(str);
        },
        nullToDash: function(str) {
            return nullToDefault(str, "-");
        },
        nullToDefault: function(str, defaultString) {
            return nullToDefault(str, defaultString);
        },
        pageRowNumber: function(pageNo, pageSize, index, totalCount) {
            return pageRowNumber(pageNo, pageSize, index, totalCount);
        },
        isEmpty : function(str) {
        	return isEmpty(str);
        },
        isNotEmpty : function(str) {
        	return !isEmpty(str);
        }
    };
})();