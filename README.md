# imgLoader
An experiment to load and resize images in the browser. It's not always the right solution, but it:

- massively reduces the amount of data uploaded if you only want a thumbnail or smallish image
- reduces the time users need to wait for images to appear to have uploaded
- allows you to manipulate in the browser before uploading (add watermarks, overlays, crop etc)
- reduces the need for server based image processing (ImageTragick anyone?)

## Basic usage

Sample: http://www.madebywill.net/imgLoader/sample/

Include the file `imgLoader.min.js` in your page, this will add a factory function `imgLoader` 
to the global window.

```
var uploader = imgLoader({
                inputId: "file-picker",
                templates: [{
                        id: "thumb",
                        width: 300,
                        height: 300,
                        displayElementId: "thumb-preview",
                        method: "fit"
                    },
                    {
                        id: "full",
                        width: 1200,
                        height: 1200,
                        displayElementId: "fullsize-preview",
                        method: "fit"
                    }
                ]
            }).on("success", function(result){
                // handle the result
            }).on("error", function(err){
                // handle an error
            }).on("status", function(status){
                // handle a status change
            });
```

Create an instance of imgLoader as above, passing in the required settings:

- `inputId` - the id of an existing `<input type="file" name="file-picker" id="file-picker" accept="image/*">` element
- `templates` - an array with one or more templates you want to run the image through (see below)

### Templates

Each template should specify the settings for one resulting image you want, you can have as many 
templates as required, each should specify the following:

- `id` - a unique id for the template, used to access the resulting image in a `success` event 
- `width` and `height` - the size you want the image resized to
- `method` - how you want the image to be resized, see Image resizing methods below
- `displayElementId` - a `<canvas>` element will be created here to display the resulting image.

### Results

Once an image has been selected and resized, a single success event is emitted, each template has a result object 
in the following format:

```

{
    templateId: {
        canvas: canvas,
        ctx: CanvasRenderingContext2D,
        inputFile: File,
        template: Object,
        getImage: function(fileType, quality)
    },
    secondTemplateId: {
        /// ...
    }
}

```
- `canvas` references the resulting `<canvas>` that is created for this template
- `ctx` references the `CanvasRenderingContext2D` for `canvas`
- `inputFile` references the file object from the `<input type="file" />` element
- `template` references the template that was used for this result
- `getImage([fileType, quality])` - get the base64 encoded string for this image, see below

## getImage()

Once you have an image result, you can use getImage() to get a base64 encoded string representation of that image.

By default, this will be a png if the uploaded image was a png, otherwise it will be a jpeg saved at 92% quality.

You can override the image type, and quality level as follows:

- `getImage("png")` to force a png
- `getImage("jpeg")` to force a jpeg
- `getImage("jpeg", 0.5)` to force a jpeg with 50% quality setting, this should be a number between 0 and 1

The resulting string is what you want to save on the server.

## Saving on the server

You'll be sending the server a base64 encoded image file, so you'll need to decode this and save to
disk. I'm a big fan of serverless scripts and dumb storage (Azure Functions & Blob Storage or AWS Lambda & S3).

There is a very basic (and absolutely not for production) node sample (see /server).

## Events

Subscribe to events as part of initialization by chaining `.on()` methods as follows.

```
var myUploader = imgLoader({
                    // settings here
                }).on("success", function(result){
                    // handle the result
                }).on("error", function(err){
                    // handle an error
                }).on("status", function(status){
                    // handle a status change
                });
```

### `Success`

The image has been loaded, resized and displayed/returned.

### `Error`

Something has gone wrong, currently only `UNSUPPORTED_FILE_FORMAT` errors are emitted.

### `Status`

#### `Loading`

The image is being loaded into memory

#### `Processing`

The image has loaded and is being resized - a huge image on a slow device could 
take a few seconds here, but this is gernerally pretty instant.

#### `Done`

The image has been resized and the results returned.

## Image resizing methods

There are two options to resize images, `fit` and `minfit`.

### `fit`

The image will be resized to so the width and height both fit within the parameters you specify, 
but it won't necessarily fill the width/height. A portrait image will fill the height, but not the width,
and a landscape image will fill the width, but not the height. The image is not cropped.

### `minfit`

The image will be resized so the width and height are both equal to or greater than the the 
width/height you specify. No cropping takes place, so it's likely the image will be larger than 
the width/height specified, but it allows you to then crop/position as required.

## File Formats

This works with: jpeg, png, gif, bmp, svg, ico and webp. Some of these won't be supported in 
all browsers, as long as `<canvas>` supports the image format in the browser you're using, there 
should be no issues.