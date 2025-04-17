const loader = document.getElementById("loader");
const body = document.body;
const header = document.querySelector('header');
const main = document.querySelector('main');

document.onreadystatechange = function () {
  if (this.readyState !== "complete") {
    document.querySelector("body").style.visibility = "hidden";
    loader.style.visibility = "visible";
    document.querySelector("body").style.overflowY = "hidden";
  } else {
    setTimeout(() => {
        loader.style.transform = 'translateY(-100%)';
        loader.style.visibility = 'hidden';
        document.querySelector("body").style.visibility = "visible";
        document.querySelector("body").style.overflowY = "unset";
        header.style.display = 'flex';
        main.style.display = 'block';
    }, 2000)
  }
};

const toggleButton = document.querySelector('.mode-input');
const mode = document.querySelector('.mode');
const moon = document.querySelector('.moon');
const sun = document.querySelector('.sun');

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.setAttribute('data-theme', 'light');
}

// Apply saved theme
if (savedTheme === 'dark-theme') {
  body.classList.add('dark-theme');
  mode.classList.add('mode-dark');
  if (loader) loader.classList.add('loader-dark');
  toggleButton.checked = true;
  updateIcons(true);
} else {
  updateIcons(false);
}

toggleButton.addEventListener('change', () => {
  const isDark = toggleButton.checked;
  console.log(isDark);
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  body.classList.toggle('dark-theme', isDark);
  mode.classList.toggle('mode-dark', isDark);
  if (loader) loader.classList.toggle('loader-dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark-theme' : '');
  updateIcons(isDark);
});

function updateIcons(isDark) {
  if (isDark) {
    sun.style.opacity = '0';
    moon.style.opacity = '1';
  } else {
    sun.style.opacity = '1';
    moon.style.opacity = '0';
  }
}
