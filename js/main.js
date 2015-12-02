_.mixin({
    capitalize : function(string) {
        return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
    }
});

$(function(){
    var MM = 3.779528;
    var PX = 0.264583;
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

    function mm(val){
        return val*MM;
    }
    function px(val){
        return val*PX;
    }

    function eachCorners(cb){
        var a = [left, right, top, bottom];
        for(var i=0; i< a.length; i++){
            cb(a[i]);
        }
    }

    var BarcodeEditor = Backbone.Model.extend({
        items: [],
        initialize: function(a){
            var self = this;

            eachCorners(function(type){
                self.on('change:'+type+'Border', function(_self, value){
                    if(_self != self) value = _self;
                    if(value){
                        self.updateValue(type, value);

                        if(type == left || type == top){
                            self.view.$items.css(type, mm(value));
                        }

                        var val =
                            self.get('page'+ _.capitalize(direction[type]))
                            - self.get(oppositeCorner[type]+'Border')
                            - value;

                        self.view.$items[direction[type]](mm(val));
                    }
                });
            });

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

            this.on('change:pageWidth', function(_self, value){
                if(_self != self) value = _self;
                this.view.$page.width(mm(value));

                var rightBorder = this.get('rightBorder');
                this.unset('rightBorder').set('rightBorder', rightBorder);

                this.view.setParam('pageWidth', value);
            });

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

            this.on('change:fontSize', function(){
                this.view.setParam('fontSize', this.get('fontSize'));
                this.updateItems();
            });
            this.on('change:imageWidth', function(){
                this.view.setParam('imageWidth', this.get('imageWidth'));
                this.updateItems();
            });
            this.on('change:itemWidth', function(){
                this.view.setParam('itemWidth', this.get('itemWidth'));
                this.updateItems();
            });
            this.on('change:itemHeight', function(){
                this.view.setParam('itemHeight', this.get('itemHeight'));
                this.updateItems();
            });
            this.on('change:text', function(){
                this.view.setParam('text', this.get('text'));
                this.updateItems();
            });

            this.view = new BarcodeEditorView({model: this, el: $(this.get('selector'))});
            this.view.render();

            this.clear().set(a);
        },
        updateItems: function(){
            for(var i=0; i<this.items.length;i++){
                this.items[i].setStyle(this.getItemStyle());
            }
        },
        getItemStyle: function(){
            return {
                fontSize: this.get('fontSize'),
                width: this.get('itemWidth'),
                height: this.get('itemHeight'),
                imageWidth: this.get('imageWidth'),
                text: this.get('text')
            };
        },
        updateValue: function(type, value){
            this.view.rules[type].css(type, mm(value)).html('<span>'+parseInt(value)+'</span>');
            this.view.setParam(type+'Border', value);
        },
        addItem: function(){
            var item = new BarcodeItem();
            item.render();
            item.setStyle(this.getItemStyle());
            this.view.$items.append(item.$el);
            this.items.push(item);
        },
        popItem: function(){
            this.items[this.items.length-1].remove();
            this.items.pop();
        }
    });

    var BarcodeItem = Backbone.View.extend({
        className: 'item',
        template:
        '<div class="wrap">\
            <div class="cell">\
                <p></p>\
                <img src="images/barcode.png">\
            </div>\
        </div>',

        render: function(){
            this.$el.html(_.template(this.template)());
        },
        setStyle: function(style){
            this.$el.css({
                width: mm(style.width),
                height: mm(style.height)
            });
            this.$el.find('p').css('fontSize', style.fontSize).text(style.text);
            this.$el.find('img').css('width', mm(style.imageWidth));
        }
    });

    var BarcodeEditorView = Backbone.View.extend({
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

            this.$items.resizable({
                handles: 'n, e, s, w',
                containment: "parent",
                resize: function(e, ui){
                    var pos = self.$items.position();
                    pos.right = mm(model.get('pageWidth'))-(pos.left+ui.size.width);
                    pos.bottom = mm(model.get('pageHeight'))-(pos.top+ui.size.height);

                    model.set({
                        topBorder: pos.top,
                        rightBorder: pos.right,
                        bottomBorder: pos.bottom,
                        leftBorder: pos.left
                    }, {silent: true});

                    eachCorners(function(type){
                        model.updateValue(type, px(pos[type]));
                    });
                }
            });

            this.$params.change(function(){
                var $th = $(this);
                var val = $th.val();
                if($th.attr('type') == 'number'){
                    val = parseInt(val);
                }
                model.set($th.attr('name'), val);
            });
        },
        setParam: function(name, val){
            var $el = this.$params.filter('[name="'+name+'"]');
            if($el.attr('type')=='number') val = parseInt(val);
            $el.val(val);
        }
    });

    window.a = new BarcodeEditor({
        selector: '#barcodeEditor',
        pageWidth: 210,
        pageHeight: 230,
        topBorder: 5,
        rightBorder: 5,
        bottomBorder: 5,
        leftBorder: 5,
        fontSize: 12,
        imageWidth: 100,
        itemWidth: 150,
        itemHeight: 50,
        text: 'Съеш еще этих мягких булок',
        itemsCount: 3
    });
});