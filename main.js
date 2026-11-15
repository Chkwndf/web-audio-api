const mainAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const freqInput = document.getElementById("freqInput");
const waveformInput = document.getElementById("waveformInput");

button1.addEventListener("click", () => playFrequency(mainAudioCtx, getFrequency(), getWaveform(), 1));
button2.addEventListener("click", () => playSweepFilter(mainAudioCtx));

function getFrequency() {
    let freq = freqInput.value

    if (freq === "") {
        alert("주파수는 유효한 수여야 하며, 비어있을 수 없습니다.")
        return;
    }

    freq = Number(freq);

    return freq
}

function getWaveform() {
    return waveformInput.value;
}

/*
// #region 전역 오디오 재생 권한 미리 획득

// 1. 앱 전체에서 공유할 단일 AudioContext
const AudioContextClass =
  window.AudioContext || window.webkitAudioContext;

const audioCtx = new AudioContextClass();

// 2. 사용자 입력 이벤트
const UNLOCK_EVENTS = [
  'pointerdown',
  'touchstart',
  'keydown',
  'click'
];

let unlocking = false;

// 3. 이벤트 리스너 관리
function addUnlockEvents() {
  UNLOCK_EVENTS.forEach((event) => {
    document.addEventListener(
      event,
      unlockAudioContext,
      true
    );
  });
}

function removeUnlockEvents() {
  UNLOCK_EVENTS.forEach((event) => {
    document.removeEventListener(
      event,
      unlockAudioContext,
      true
    );
  });
}

// 4. 오디오 잠금 해제
function unlockAudioContext() {
  if (audioCtx.state === 'running') {
    removeUnlockEvents();
    return;
  }

  if (audioCtx.state === 'closed' || unlocking) {
    return;
  }

  unlocking = true;

  audioCtx.resume()
    .then(() => {
      if (audioCtx.state === 'running') {
        // 모바일 오디오 엔진 활성화를 위한 무음 재생
        const buffer = audioCtx.createBuffer(
          1,
          1,
          audioCtx.sampleRate
        );

        const source = audioCtx.createBufferSource();

        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        removeUnlockEvents();

        console.log('오디오 컨텍스트 잠금 해제 완료');
      }
    })
    .catch((err) => {
      console.warn('오디오 잠금 해제 대기 중:', err);
    })
    .finally(() => {
      unlocking = false;
    });
}

// 5. 최초 사용자 입력 감지
addUnlockEvents();

// 6. 백그라운드 복귀 대응
document.addEventListener('visibilitychange', () => {
  if (
    document.visibilityState !== 'visible' ||
    audioCtx.state === 'running' ||
    audioCtx.state === 'closed'
  ) {
    return;
  }

  audioCtx.resume()
    .then(() => {
      if (audioCtx.state === 'running') {
        removeUnlockEvents();
        console.log('백그라운드 복귀 후 오디오 복구 완료');
      }
    })
    .catch((err) => {
      // 사용자 입력이 필요한 경우 다시 입력 대기
      addUnlockEvents();

      console.warn('백그라운드 복귀 후 터치 대기 중:', err);
    });
});

// #endregion
*/

function playFrequency(ctx, frequency, waveform, duration) {
    const now = ctx.currentTime;

    // 2. 발진기(Oscillator) 및 볼륨(Gain) 노드 생성
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 3. 파형 및 주파수 설정
    oscillator.type = waveform; // 파형: sine(사인파), square(사각파), sawtooth(톱니파), triangle(삼각파)
    oscillator.frequency.setValueAtTime(frequency, now); // 주파수(Hz) 설정

    // 4. 볼륨 설정 (0.0 ~ 1.0)
    gainNode.gain.setValueAtTime(0.5, now);

    // 5. 노드 연결: 발진기 -> 볼륨 조절 -> 스피커(출력)
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 6. 소리 재생 및 종료 예약
    oscillator.start();
    oscillator.stop(now + duration);
}

function playSweepFilter(ctx) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; // 배음이 풍부한 톱니파
    osc.frequency.setValueAtTime(110, now); // 낮은 '라' 음

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(8, now); // 공명감을 높여 전자음 느낌 강조

    // 필터 주파수를 0.1초간 100Hz에서 3000Hz까지 부드럽게 올림
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 1.5);

    osc.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.5);
}