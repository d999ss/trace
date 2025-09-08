<script>
// Aggressive PrintMyRide logo replacement
function replaceLogo() {
  document.querySelectorAll("img").forEach(function(img) {
    if (img.src && (img.src.includes("nuevologo") || img.src.includes("301409ac") || img.src.includes("Screen+Shot") || img.src.includes("squarespace-cdn"))) {
      img.src = "printmyride-logo.png";
      img.alt = "PrintMyRide Logo";
      img.style.maxHeight = "40px";
      img.style.width = "auto";
    }
  });
}
// Run immediately and repeatedly
replaceLogo();
setTimeout(replaceLogo, 500);
setTimeout(replaceLogo, 1000);
setTimeout(replaceLogo, 2000);
setInterval(replaceLogo, 3000);
</script>
