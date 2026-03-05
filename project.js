(function() {
    setInterval(() => {
        const before = performance.now();
        debugger;
        if(performance.now() - before > 5) {
            document.body.innerHTML = '';
            location.replace('about:blank');
        }
    }, 100);
    
    setInterval(() => {
        const w = window.outerWidth - window.innerWidth;
        const h = window.outerHeight - window.innerHeight;
        if(w > 200 || h > 200) document.body.innerHTML = '';
    }, 500);
    
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    
    document.addEventListener('keydown', e => {
        const k = e.key || e.code;
        if(k === 'F12') e.preventDefault();
        if(e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(k)) e.preventDefault();
        if(e.ctrlKey && k === 'U') e.preventDefault();
    });
    
    if(navigator.webdriver) location.replace('about:blank');
})();
