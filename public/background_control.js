document.addEventListener('DOMContentLoaded', function () {
    const canvas_2 = document.getElementById('canvas1');
    const ctx_2 = canvas_2.getContext('2d');
    let showBackground_2 = true;
    let originalImage_2 = new Image();
    let uploadedImageUrl_2 = null;
  
    document.getElementById('fileInput').addEventListener('change', function (event_2) {
      const file_2 = event_2.target.files[0];
      if (file_2) {
        const reader_2 = new FileReader();
        reader_2.onload = function (e_2) {
          uploadedImageUrl_2 = e_2.target.result;
          originalImage_2.src = uploadedImageUrl_2;
          originalImage_2.onload = function () {
            drawOriginalImage_2();
          }
        }
        reader_2.readAsDataURL(file_2);
      }
    });
  
    document.getElementById('toggleBackgroundButton2').addEventListener('click', function () {
      console.log('toggleBackgroundButton2 clicked');
      showBackground_2 = !showBackground_2;
      if (showBackground_2) {
        drawOriginalImage_2();
      } else {
        clearBackground_2();
      }
    });
  
    function drawOriginalImage_2() {
      if (uploadedImageUrl_2) {
        ctx_2.drawImage(originalImage_2, 0, 0, canvas_2.width, canvas_2.height);
        console.log('Original image drawn');
      }
    }
  
    function clearBackground_2() {
      ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);
    }
  
    // Ensure the background is drawn initially if an image was already uploaded
    if (uploadedImageUrl_2) {
      drawOriginalImage_2();
    }
});
