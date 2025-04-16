const loader = document.getElementById("loader");

document.onreadystatechange = function () {
  if (this.readyState !== "complete") {
    document.querySelector("body").style.visibility = "hidden";
    loader.style.visibility = "visible";
    document.querySelector("body").style.overflowY = "hidden";
  } else {
    setTimeout(() => {
        loader.style.transform = 'translateY(100%)';
        loader.style.visibility = 'hidden';
    }, 2000)
  }
};
