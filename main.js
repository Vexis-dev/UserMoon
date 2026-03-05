const responses = {
    normal: 'Привет! Я UserMoon. Готов помочь с чем угодно — спрашивай, объясню подробно и нейтрально.',
    rough: 'Слушай, я UserMoon. Время дорого, задавай вопрос сразу по делу. Без воды.',
    toxic: 'О, ещё один. Я UserMoon, и да, я умею думать. Чего надо? Или просто потрепаться пришёл?'
};

const modeBtns = document.querySelectorAll('.mode-btn');
const typing = document.querySelector('.typing');

function typeText(text) {
    typing.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
        typing.textContent += text[i];
        i++;
        if(i >= text.length) clearInterval(interval);
    }, 30);
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        typeText(responses[btn.dataset.mode]);
    });
});

typeText(responses.normal);
