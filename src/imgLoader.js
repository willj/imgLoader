function imgLoader(settings){

    var filePicker, results = {};

    if (!settings.inputId || !settings.templates || (settings.templates.length < 1)){
        return console.error("You must specify the id of a file input element and at least one job template");
    }

    filePicker = document.getElementById(settings.inputId);
    filePicker.addEventListener("change", loadImage);

    function loadImage(event){

        console.log(event);

        // check event.target.files[0].type is valid image
        // assign and pass through so we can save as the correct type

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

        for (var i = 0; i < settings.templates.length; i++){
            resizeImage(img, settings.templates[i]);
        }

        if (settings.callback){
            settings.callback(results);
        }
    }

    function resizeImage(img, template){
        if (!results[template.id]){
            var r = Object.create(imageResult);
            r.canvas = document.createElement("canvas");
            r.ctx = r.canvas.getContext("2d");
            if (template.displayElementId){
                document.getElementById(template.displayElementId).appendChild(r.canvas);
            }

            results[template.id] = r;
        }

        var scaledSize = calcDimensions(img.width, img.height, template.width, template.height);
        results[template.id].canvas.width = scaledSize.width;
        results[template.id].canvas.height = scaledSize.height;
        results[template.id].ctx.drawImage(img, 0, 0, scaledSize.width, scaledSize.height);
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
        getImageData: function(){
            return this.canvas.toDataURL("image/jpeg");
        }
    };

}