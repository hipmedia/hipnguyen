  const music = document.getElementById("tetMusic");
    const btn = document.getElementById("toggleMusic");
    const fireworks = document.getElementById("fireworks");
    let isPlaying = false;

    btn.addEventListener("click", () => {
  if (isPlaying) {
    music.pause();
    btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else {
    music.play();
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
  isPlaying = !isPlaying;
});


    const countdown = () => {
      const newYear = new Date("2027-02-06T00:00:00").getTime();
      const now = new Date().getTime();
      const distance = newYear - now;

      if (distance <= 0) {
        document.getElementById("countdown").style.display = "none";
        if (window.startFireworksEffect) {
          window.startFireworksEffect();
        } else {
          fireworks.style.display = "flex";
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("days").innerText = days;
      document.getElementById("hours").innerText = hours;
      document.getElementById("minutes").innerText = minutes;
      document.getElementById("seconds").innerText = seconds;
    };

    setInterval(countdown, 1000);

    countdown();
