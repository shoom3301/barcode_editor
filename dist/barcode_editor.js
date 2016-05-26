(function(factory){
    if (typeof define === "function" && define.amd) {
        define(["jquery", "underscore", "backbone", "jquery-ui/resizable", "jQuery.print"], factory);
    } else if (typeof exports === 'object') {
        factory(require("jquery", "underscore", "backbone", "jquery-ui/resizable", "jQuery.print"));
    } else {
        factory(jQuery, _, Backbone);
    }
})(function($, _, Backbone){
    //1 mm = 3.779528 px
    var MM = 3.779528;
    //1 px = 0.264583 mm
    var PX = 0.264583;
    //shortcuts
    var right = 'right', left = 'left', top = 'top', bottom = 'bottom';
    var direction = {
        left: 'width',
        right: 'width',
        top: 'height',
        bottom: 'height'
    };
    var oppositeCorner = {
        left: 'right',
        right: 'left',
        bottom: 'top',
        top: 'bottom'
    };

    /**
     * Px to mm
     * @param val {int}
     * @returns {number}
     */
    function mm(val){
        return val*MM;
    }

    /**
     * Mm to px
     * @param val
     * @returns {number}
     */
    function px(val){
        return val*PX;
    }

    /**
     * Capitalize string
     * @param string {string}
     * @returns {string}
     */
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    }

    /**
     * Cycle for 4 corners
     * @param cb {function}
     */
    function eachCorners(cb){
        var a = [left, right, top, bottom];
        for(var i=0; i< a.length; i++){
            cb(a[i]);
        }
    }

    /**
     * Barcode editor classs
     * @constructor
     */
    var BarcodeEditor = Backbone.Model.extend({
        /**
         * @param params {object}
         */
        initialize: function(params){
            var self = this;

            //Array of items
            this.items = [];

            //bind change listener for borders
            eachCorners(function(type){
                self.on('change:'+type+'Border', function(_self, value){
                    if(_self != self) value = _self;
                    if(value){
                        self.updateBorderValue(type, value);

                        if(type == left || type == top){
                            self.view.$items.css(type, mm(value));
                        }

                        var val =
                            self.get('page'+ capitalize(direction[type]))
                            - self.get(oppositeCorner[type]+'Border')
                            - value;

                        self.view.$items[direction[type]](mm(val));
                    }
                });
            });

            //listen change page height
            this.on('change:pageHeight', function(_self, value){
                if(_self != self) value = _self;
                if(value){
                    this.view.$page.height(mm(value));

                    self.view.rules.left.css('line-height', mm(value)+'px');
                    self.view.rules.right.css('line-height', mm(value)+'px');

                    var toBorder = this.get('topBorder');
                    this.unset('topBorder').set('topBorder', toBorder);

                    this.view.setParam('pageHeight', value);
                }
            });

            //listen change page width
            this.on('change:pageWidth', function(_self, value){
                if(_self != self) value = _self;
                this.view.$page.width(mm(value));

                var rightBorder = this.get('rightBorder');
                this.unset('rightBorder').set('rightBorder', rightBorder);

                this.view.setParam('pageWidth', value);
            });

            //listen change barcode items count
            this.on('change:itemsCount', function(_self, value){
                if(_self != self) value = _self;
                if(value<0){
                    return;
                }
                var old = (this.previous('itemsCount') || 0);

                if(old<value){
                    for(var i=0; i<(value - old); i++){
                        self.addItem();
                    }
                }else{
                    for(var s=0; s<(old - value); s++){
                        self.popItem();
                    }
                }

                this.view.setParam('itemsCount', value);
            });

            this.on('change:fontSize', function(_self, value){
                var $span = $('<span>').html('1').css({
                    fontSize: value,
                    fontFamily: 'Courier, monospace'
                });
                $('body').append($span);
                this.set('charWidth', $span.width());
                $span.remove();
            });

            this.on('destroy', function(){
                this.view.remove();
            });

            //listen change barcode item style
            _.each(['fontSize', 'imageWidth', 'itemWidth', 'itemHeight', 'text'], function(type){
                self.on('change:'+type, function(){
                    self.view.setParam(type, self.get(type));
                    self.updateItems();
                });
            });

            /**
             * View of editor
             * @type {BarcodeEditorView}
             */
            this.view = new BarcodeEditorView({model: this, el: $(this.get('selector'))});
            this.view.render();

            /**
             * Trigger all change listeners
             */
            this.clear().set(params);
        },
        /**
         * Update items styling
         */
        updateItems: function(){
            for(var i=0; i<this.items.length;i++){
                this.items[i].setStyle(this.getItemStyle());
            }
        },
        /**
         * Object of item style
         * @returns {object}
         */
        getItemStyle: function(){
            return {
                fontSize: this.get('fontSize'),
                width: this.get('itemWidth'),
                height: this.get('itemHeight'),
                imageWidth: this.get('imageWidth'),
                charWidth: this.get('charWidth'),
                text: this.get('text')
            };
        },
        /**
         * Update borders value
         * @param type {string} border name (top|left...)
         * @param value {int} value
         */
        updateBorderValue: function(type, value){
            this.view.rules[type].css(type, mm(value)).html('<span>'+parseInt(value)+'</span>');
            this.view.setParam(type+'Border', value);
        },
        /**
         * Add new barcode item
         */
        addItem: function(options){
            options = options || {};
            var params = {};
            var imgsrc = this.get('barcodeImage');
            if(imgsrc){
                params.src = options.src || imgsrc;
            }
            params.attrs = options.attrs || [];
            var item = new BarcodeItem(params);
            item.render();
            item.setStyle(_.extend(this.getItemStyle(), options));
            this.view.$items.append(item.$el);
            this.items.push(item);

            return item;
        },
        /**
         * Pop one barcode item
         */
        popItem: function(){
            this.items[this.items.length-1].remove();
            this.items.pop();
        },
        /**
         * Count of items in one page
         * @returns {int}
         */
        countInPage: function(){
            var inRow = Math.floor(this.get('pageWidth')/this.get('itemWidth'));
            var rowsCount = Math.floor(this.get('pageHeight')/this.get('itemHeight'));
            return inRow*rowsCount;
        }
    });

    /**
     * Barcode item view
     * @constructor
     */
    var BarcodeItem = Backbone.View.extend({
        className: 'item',
        template:
            '<div class="wrap">\
                <div class="cell">\
                    <p></p>\
                    <div class="img"><img src="<%= src %>"></div>\
                    <% if(attrs && attrs.length){ %>\
                    <div class="attrs">\
                    <% _.each(attrs, function(attr){ %>\
                    <div><label><%- attr.title %>: </label><span><%- attr.val %></span></div>\
                    <% }) %>\
                    </div>\
                    <% } %>\
                </div>\
            </div>',
        initialize: function(options){
            this.options = options;
        },
        /**
         * Rendering barcode item
         */
        render: function(){
            this.$el.html(_.template(this.template)(this.options));
            var self = this;
            this.$el.find('img').on('load', function(){
                self.trigger('imageLoaded');
            });
        },
        /**
         * Set style to barcode item
         * @param style {object}
         * @see BarcodeEditor.getItemStyle
         */
        setStyle: function(style){
            var textRowsCount = 2;
            var width = mm(style.width);
            this.$el.css({
                width: width,
                height: mm(style.height)
            });
            this.$el.find('p').css({
                fontSize: style.fontSize,
                fontFamily: 'Courier, monospace'
            }).text(this.strMax(style.text, width*textRowsCount/(style.charWidth||10)));
            this.$el.find('img').css('width', mm(style.imageWidth));
        },
        strMax: function(str, len){
            if(!str || !str.length) return '';
            return (str.length > len)?(str.substr(0, len-2)+'..'):str;
        }
    });

    /**
     * View of barcode editor
     * @constructor
     */
    var BarcodeEditorView = Backbone.View.extend({
        events: {
            'click button.print': 'print'
        },
        initialize: function(){
            this.$page = this.$('.pageHandler .page');
            this.$items = this.$page.children('.items');
            this.$rules = this.$page.children('.rule');
            this.$params = this.$el.find('.parameters input[type="number"], .parameters input[type="text"]');

            this.rules = {};

            var self = this;
            eachCorners(function(type){
                self.rules[type] = self.$rules.filter('.'+type);
            });
        },
        render: function(){
            var self = this;
            var model = this.model;

            //Make items block resizable
            this.$items.resizable({
                handles: 'n, e, s, w',
                containment: "parent",
                resize: function(e, ui){
                    var pos = self.$items.position();
                    pos.right = mm(model.get('pageWidth'))-(pos.left+ui.size.width);
                    pos.bottom = mm(model.get('pageHeight'))-(pos.top+ui.size.height);

                    //bind update corners
                    eachCorners(function(type){
                        model.updateBorderValue(type, px(pos[type]));
                    });
                }
            });

            //bind params inputs chamge to model change
            this.$params.change(function(){
                var $th = $(this);
                var val = $th.val();
                if($th.attr('type') == 'number'){
                    val = parseInt(val);
                }
                model.set($th.attr('name'), val);
            });
        },
        /**
         * Print page
         */
        print: function(){
            var model = this.model;
            var inPage = model.countInPage(), total = model.items.length, currentHeight = model.get('pageHeight');
            var deferred = $.Deferred();

            model.set('pageHeight', Math.ceil(total/inPage)*currentHeight);

            deferred.then(function(){
                model.set('pageHeight', currentHeight);
            });

            this.$el.print({
                deferred: deferred
            });
        },
        /**
         * Set parameter to input
         * @param name {string} name
         * @param val {*} value
         */
        setParam: function(name, val){
            var $el = this.$params.filter('[name="'+name+'"]');
            if($el.attr('type')=='number') val = parseInt(val);
            $el.val(val);
        }
    });

    /**
     * Print barcodes without render
     * @param parameters {object}
     * @param codes {Array}
     */
    BarcodeEditor.printBarcodes = function(parameters, codes){
        parameters.itemsCount = 0;
        var tpl =
            $('<div class="barcodeEditor"><div class="pageHandler"><div class="page"><div class="items"></div></div></div></div>');
        tpl.css({position: 'absolute', left: '-9000px', top: '-9000px'}).attr('id', _.uniqueId('beditor_'));

        $('body').append(tpl);

        parameters.selector = '#'+tpl.attr('id');
        var editors = new BarcodeEditor(parameters);
        var totalImages = codes.length+1-1;

        function print(){
            editors.view.$el.css('position', 'static');
            editors.view.print();
            editors.destroy();
        }

        for(var i=0; i<codes.length; i++){
            var item = editors.addItem(codes[i]);
            item.on('imageLoaded', function(){
                totalImages--;
                if(totalImages <= 0){
                    print();
                }
            });
        }
    };

    window.BarcodeEditorFactory = {
        Model: BarcodeEditor,
        View: BarcodeEditorView,
        ItemView: BarcodeItem
    };

    return BarcodeEditor;
});