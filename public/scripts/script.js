const inputs = document.querySelectorAll(".input");

inputs.forEach((input) => {
  const label = input.previousElementSibling;
  input.addEventListener("focus", () => {
    label.classList.add("type");
    input.style.borderColor = "#7f5af0";
  });

  input.addEventListener("blur", () => {
    if (input.value !== "") {
      return;
    } else {
      label.classList.remove("type");
      input.style.borderColor = "var(--text-color)";
    }
  });
});
