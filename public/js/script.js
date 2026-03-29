const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const videoStep = document.getElementById('video-step');

function diapoGestion() {
    const scrollTop = window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScroll;

    if (scrollFraction < 0.33) {
        videoStep.classList.add('active');
        step1.classList.remove('active');
        step2.classList.remove('active');
    } 
    else if (scrollFraction >= 0.33 && scrollFraction < 0.66) {
        videoStep.classList.remove('active');
        step1.classList.add('active');
        step2.classList.remove('active');
    } 
    else {
        videoStep.classList.remove('active');
        step1.classList.remove('active');
        step2.classList.add('active');
    }
}

window.addEventListener('scroll', diapoGestion);