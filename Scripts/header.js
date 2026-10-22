const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('.navigation-content');

menuButton.addEventListener('click', () => {
  menu.classList.toggle('navigation-content-show');
  menuButton.classList.toggle('menu-button-active');
});

    
// Email Adresse für Bots unlesbar.
(function() {
    const parts = [
      String.fromCharCode(73,110,102,111),  // "Info"
      String.fromCharCode(64),              // "@"
      String.fromCharCode(83,99,104,97,99,104,117,110,105,111,110,45),  // "Schachunion-"
      String.fromCharCode(83,99,104,111,114,110,100,111,114,102,46,100,101)  // "Schorndorf.de"
    ];
    const email = parts.join('');
    const link = document.getElementById('contact-email');
    link.href = 'mailto:' + email;
    link.innerHTML = email;
    console.log("Test");
  })();