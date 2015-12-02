var $ww = $(window);

window.bindMethod = addEventListener?'addEventListener':'attachEvent';
/**
 * Инициализация DOM элементов
 * */
window.DOMRelative = {
    storage: [],
    inited: false,
    init: function(){
        if(!this.inited){
            var caller = function(){
                DOMRelative.init();
            };
            window[bindMethod]('load', caller);
            window[bindMethod]('resize', caller);
            window[bindMethod]('orientationchange', caller);
            this.inited = true;
        }
        for(var i=0;i<this.storage.length;i++){
            this.storage[i]();
        }
        return this;
    },
    add: function(func){
        this.storage.push(func);
        return this;
    },
    remove: function(func){
        this.storage.splice(this.storage.indexOf(func), 1);
        return this;
    }
};

/**
 * Подключение скрипта или стилей
 * */
function include(path, type, callback){
    var access = true;
    var arr = (type=='css')?'styleSheets':'scripts';

    for(var i=0;i<document[arr].length;i++){
        var stl = document[arr][i];
        if(stl && (stl.href || stl.src) && (((type=='css')?stl.href:stl.getAttribute('src'))==path)) access = false;
    }
    if(access){
        var script = document.createElement((type=='css')?'link':'script');
        script.type = 'text/'+(type=='css'?'css':(type=='template')?type:'javascript');

        if(type=='css'){
            script.rel = 'stylesheet';
            script.href = path;
        }else{
            script.src = path;
        }

        if(callback && typeof callback == 'function') script.onload = callback;
        if(callback && typeof callback == 'object'){
            var func = null;
            for(var param in callback){
                if(param == 'callback'){
                    func = callback[param];
                }else{
                    script[param] = callback[param];
                }
            }
            if(func) script.apply(func);
        }
        document.head.appendChild(script);
    }else{
        callback();
    }
}

/**
 * Процент от числа
 * */
Number.prototype.prc = function(precent){
    return this*precent/100;
};

/**
 * Удаление элемента из массива
 * */
Array.prototype.remove = function(i){
    this.splice(this.indexOf(i), 1);
    return this;
};

/**
 * Декодирование URL
 * */
function urldecode(str) {
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}

/**
 * Из URL в js объект
 * */
function parseURL(a){
    var params = urldecode((a || window.location.search).replace('?', '')).split('&');
    var data = {};
    for(var i=0;i<params.length;i++){
        var t = params[i].split('=');
        data[t[0]] = t[1];
    }
    return data;
}