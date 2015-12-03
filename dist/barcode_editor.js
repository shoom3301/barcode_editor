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
        //barcode items
        items: [],
        /**
         *
         * @param params {object}
         *
         *   selector: '#barcodeEditor'
         *   pageWidth: 210(mm)
         *   pageHeight: 230(mm)
         *   topBorder: 5(mm)
         *   rightBorder: 5(mm)
         *   bottomBorder: 5(mm)
         *   leftBorder: 5(mm)
         *   fontSize: 12(px)
         *   imageWidth: 100(mm)
         *   itemWidth: 150(mm)
         *   itemHeight: 50(mm)
         *   text: 'Съеш еще этих мягких булок'
         *   itemsCount: 3,
         *   barcodeImage: 'dist/barcode.png',
         *
         */
        initialize: function(params){
            var self = this;

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
        addItem: function(){
            var params = {};
            var imgsrc = this.get('barcodeImage');
            if(imgsrc){
                params.src = imgsrc;
            }
            var item = new BarcodeItem(params);
            item.render();
            item.setStyle(this.getItemStyle());
            this.view.$items.append(item.$el);
            this.items.push(item);
        },
        /**
         * Pop one barcode item
         */
        popItem: function(){
            this.items[this.items.length-1].remove();
            this.items.pop();
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
                    <img>\
                </div>\
            </div>',
        initialize: function(options){
            this.options = options;
        },
        /**
         * Rendering barcode item
         */
        render: function(){
            this.$el.html(_.template(this.template)());
            this.$el.find('img').attr('src', (this.options.src || 'dist/barcode.png'));
        },
        /**
         * Set style to barcode item
         * @param style {object}
         * @see BarcodeEditor.getItemStyle
         */
        setStyle: function(style){
            this.$el.css({
                width: mm(style.width),
                height: mm(style.height)
            });
            this.$el.find('p').css('fontSize', style.fontSize).text(style.text);
            this.$el.find('img').css('width', mm(style.imageWidth));
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
            this.$el.print({});
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

    window.BarcodeEditor = {
        Model: BarcodeEditor,
        View: BarcodeEditorView,
        ItemView: BarcodeItem
    };

    return window.BarcodeEditor.Model;
});