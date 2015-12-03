# Barcode editor

Preview barcodes to page, change page size and borders, customize barcode view.
All sizes in parametes measured in milimeters (aside font-size, in pixels).
Backbone based, its mean that you can change parameters of editor just call `set` method, for example: 
```js
editor.set('pageWidth', 120);
```

Or rerender view:

```js
editor.view.render();
```

## Options

`selector` - selector to template. Example: `#barcodeEditor`

`pageWidth` - start width of page (mm). Example: `210`

`pageHeight` - start height of page (mm). Example: `230`

`topBorder` - margin of top border (mm). Example: `5`

`rightBorder` - margin of right border (mm). Example: `5`

`bottomBorder` - margin of bottom border (mm). Example: `5`

`leftBorder` - margin of left border (mm). Example: `5`

`fontSize` - font size of barcode text (px). Example: `14`

`imageWidth` - width of barcode image (mm). Example: `50`

`itemWidth` - width of barcode item (mm). Example: `80`

`itemHeight` - height of barcode item (mm). Example: `40`

`text` - text in barcode item. Example: `Мать писала, на войне был`

`barcodeImage` - url to barcode image. Example: `images/barcode.png`, default: `dist/barcode.png`

`itemsCount` - start count of barcode items. Example: `3`

## Example

```js
require(["barcodeEditor"], function(BarcodeEditor){
			var editor = new BarcodeEditor({
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
				barcodeImage: 'dist/barcode.png',
				itemsCount: 3
			});
		});
```

## Template

```html
<div id="barcodeEditor">
    <div class="pageHandler">
        <div class="page">
            <a class="rule top"></a>
            <a class="rule right"></a>
            <a class="rule bottom"></a>
            <a class="rule left"></a>
            <div class="items"></div>
        </div>
    </div>
    <div class="parameters">
        <div class="param">
            <label>Page height:</label>
            <input min="0" type="number" name="pageHeight"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Page width:</label>
            <input min="0" type="number" name="pageWidth"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Top:</label>
            <input min="0" type="number" name="topBorder"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Right:</label>
            <input min="0" type="number" name="rightBorder"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Bottom:</label>
            <input min="0" type="number" name="bottomBorder"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Left:</label>
            <input min="0" type="number" name="leftBorder"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Font-size:</label>
            <input min="0" type="number" name="fontSize"/>
            <span class="postfix">pt</span>
        </div>
        <div class="param">
            <label>Barcode width:</label>
            <input min="0" type="number" name="imageWidth"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Block width:</label>
            <input min="0" type="number" name="itemWidth"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Block height:</label>
            <input min="0" type="number" name="itemHeight"/>
            <span class="postfix">mm</span>
        </div>
        <div class="param">
            <label>Text:</label>
            <input type="text" name="text"/>
        </div>
        <div class="param">
            <label>Items count:</label>
            <input min="0" type="number" name="itemsCount"/>
        </div>
    </div>
    <div class="clear"></div>
</div>
```