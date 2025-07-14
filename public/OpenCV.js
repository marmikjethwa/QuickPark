
<script async src="https://docs.opencv.org/4.5.2/opencv.js" onload="onOpenCvReady();" type="text/javascript"></script>

<script>
function onOpenCvReady() {
    console.log('✅ OpenCV.js loaded');

    const input = document.getElementById('video'); // or image element
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = input.videoWidth || input.width;
    canvas.height = input.videoHeight || input.height;
    ctx.drawImage(input, 0, 0, canvas.width, canvas.height);

    let src = cv.imread(canvas);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.threshold(src, src, 120, 255, cv.THRESH_BINARY);
    
    cv.imshow('canvas', src); // preview processed result
    cv.imwrite('output.jpg', src); // optional

    Tesseract.recognize(
        canvas,
        'eng',
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        const plate = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        console.log('📦 OCR result:', plate);
        document.getElementById("numberPlate").value = plate;
    });

    src.delete();
}
</script>
