function imgLoader(settings){

    var eventManager = {
        on: function(eventName, callback){
            this[eventName] = callback;
            return evt;
        }
    };

    var evt = Object.create(eventManager);

    var filePicker, stepCanvas1, stepCtx1, stepCanvas2, stepCtx2, inputFileType, results = {};
    var supportedFileTypes = ["image/png", "image/jpeg", "image/gif", "image/bmp", "image/svg+xml", "image/x-icon", "image/webp"];

    if (!settings.inputId || !settings.templates || (settings.templates.length < 1)){
        return console.error("You must specify the id of a file input element and at least one job template");
    }

    filePicker = document.getElementById(settings.inputId);
    filePicker.addEventListener("change", loadImage);

    function loadImage(event){

        inputFileType = event.target.files[0].type;

        if (supportedFileTypes.indexOf(inputFileType) === -1){
            if (evt.error){
                return evt.error({ id: "UNSUPPORTED_FILE_FORMAT", message: "Unsupported file format" });
            }
        }

        var reader = new FileReader();

        reader.onload = function(e){
            var img = new Image();
            img.onload = imageLoaded;
            img.src = e.target.result;
        }

        reader.readAsDataURL(event.target.files[0]);
    }

    function imageLoaded(event){
        var img = event.target;

        stepCanvas1 = document.createElement("canvas");
        stepCtx1 = stepCanvas1.getContext("2d");
        stepCanvas2 = document.createElement("canvas");
        stepCtx2 = stepCanvas2.getContext("2d");

        for (var i = 0; i < settings.templates.length; i++){
            resizeImage(img, settings.templates[i]);

            stepCanvas1.width = 0;
            stepCanvas1.height = 0;
            stepCanvas2.width = 0;
            stepCanvas2.height = 0;
        }

        if (evt.success){
            evt.success(results);
        }
    }

    function resizeImage(img, template){
        if (!results[template.id]){
            var r = Object.create(imageResult);
            r.template = template;
            r.canvas = document.createElement("canvas");
            r.ctx = r.canvas.getContext("2d");
            if (template.displayElementId){
                document.getElementById(template.displayElementId).appendChild(r.canvas);
            }

            results[template.id] = r;
        }

        results[template.id].inputType = inputFileType;

        var scaledSize = calcDimensions(img.width, img.height, template.width, template.height);
        var tempImg = img;

        // if the image is more than 2x of the target size
        if(scaledSize.width < img.width / 2){
            var tempWidth = img.width;
            var tempHeight = img.height;

            do {
                // step it down by halving it each step
                // this gives *far* better anti-aliasing
                tempWidth = tempWidth * 0.5;
                tempHeight = tempHeight * 0.5;

                stepCanvas2.width = tempWidth;
                stepCanvas2.height = tempHeight;

                stepCtx2.drawImage(tempImg, 0, 0, tempWidth, tempHeight);
                tempImg = stepCanvas1;

                stepCanvas1.width = tempWidth;
                stepCanvas1.height = tempHeight;
                stepCtx1.drawImage(stepCanvas2, 0, 0, tempWidth, tempHeight);
            } while (tempWidth >= scaledSize.width * 2);
        }

        results[template.id].canvas.width = scaledSize.width;
        results[template.id].canvas.height = scaledSize.height;
        results[template.id].ctx.drawImage(tempImg, 0, 0, scaledSize.width, scaledSize.height);
    }

    function calcDimensions(origWidth, origHeight, maxWidth, maxHeight){
        if (origWidth <= maxWidth && origHeight <= maxHeight){
            return { width: origWidth, height: origHeight };
        }

        var newWidth = origWidth;
        var newHeight = origHeight;

        if (origWidth > origHeight){
            newWidth = maxWidth;
            newHeight = (maxWidth / origWidth) * origHeight;
        } else {
            newWidth = (maxHeight / origHeight) * origWidth;
            newHeight = maxHeight;
        }

        if (newWidth > maxWidth){
            newWidth = maxWidth;
            newHeight = (maxWidth / origWidth) * origHeight;
        }

        if (newHeight > maxHeight){
            newWidth = (maxHeight / origHeight) * origWidth;
            newHeight = maxHeight;
        }

        return {
            width: newWidth,
            height: newHeight
        };
    }

    var imageResult = {
        getImage: function(type, quality){
            if (!type){
                type = (this.inputType == "image/png") ? "image/png" : "image/jpeg";
            }

            return this.canvas.toDataURL(type, quality);
        }
    };

    return evt;
}