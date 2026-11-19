const ctx = new (window.AudioContext || window.webkitAudioContext)();

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const button4 = document.getElementById("button4");
const button5 = document.getElementById("button5");
const button6 = document.getElementById("button6");
const button7 = document.getElementById("button7");

button1.addEventListener('click', () => playVowelSound2("아"))
button2.addEventListener('click', () => playVowelSound2("어"))
button3.addEventListener('click', () => playVowelSound2("오"))
button4.addEventListener('click', () => playVowelSound2("우"))
button5.addEventListener('click', () => playVowelSound2("으"))
button6.addEventListener('click', () => playVowelSound2("이"))
button7.addEventListener('click', () => playVowelSound2("에"))

let currentSound = null;
const VOWEL_PRESETS = {
    '아': [
        [730,  8,  1.2], // F1
        [1090, 10, 0.8], // F2
        [2440, 12, 0.3]  // F3
    ],
    '어': [
        [640,  8,  1.2],
        [1190, 10, 0.7],
        [2390, 12, 0.3]
    ],
    '오': [
        [570,  8,  1.2],
        [840,  10, 0.6],
        [2410, 12, 0.2]
    ],
    '우': [
        [300,  8,  1.3],
        [870,  10, 0.4],
        [2240, 12, 0.15]
    ],
    '으': [
        [350,  8,  1.2],
        [1500, 10, 0.5],
        [2350, 12, 0.25]
    ],
    '이': [
        [270,  8,  1.2],
        [2290, 12, 0.7],
        [3010, 14, 0.4]
    ],
    '에': [
        [530,  8,  1.2],
        [1840, 10, 0.7],
        [2480, 12, 0.35]
    ],
    '애': [
        [660,  8,  1.2],
        [1720, 10, 0.75],
        [2410, 12, 0.35]
    ]
};

// 1. 공용 노드는 함수 밖에서 한 번만 생성 및 연결
const compressor = new DynamicsCompressorNode(ctx, {
    threshold: -24,
    knee: 30,
    ratio: 20,
    attack: 0.003,
    release: 0.15
});

const masterGain = new GainNode(ctx, { gain: 0.2 });
compressor.connect(masterGain).connect(ctx.destination);

function playVowelSound2(vowelChar) {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const now = ctx.currentTime;

    // 2. 기존 재생 중인 음이 있다면 전용 voiceGain을 줄이고 정지
    if (currentSound) {
        const { osc, voiceGain } = currentSound;
        voiceGain.gain.cancelScheduledValues(now);
        voiceGain.gain.setValueAtTime(voiceGain.gain.value, now);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        osc.stop(now + 0.02);
    }

    // 3. 새 음(Voice) 전용 노드 생성
    const osc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 120 });
    const voiceGain = new GainNode(ctx, { gain: 1 });

    // 어택(Attack)과 0.75초 뒤 자동 릴리즈(Release) 예약
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(1, now + 0.01);
    voiceGain.gain.setValueAtTime(1, now + 0.7);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    const formants = VOWEL_PRESETS[vowelChar];

    const channels = formants.map(([frequency, Q, gain]) => {
        const bpf = new BiquadFilterNode(ctx, {
            type: 'bandpass',
            frequency,
            Q
        });
        const channelGain = new GainNode(ctx, { gain });

        // 각 채널의 출력을 공용 compressor 대신 이번 음의 voiceGain으로 모음
        osc.connect(bpf).connect(channelGain).connect(voiceGain);

        return { bpf, channelGain };
    });

    // 모아진 소리를 공용 체인(compressor)으로 전달
    voiceGain.connect(compressor);

    osc.start(now);
    osc.stop(now + 0.75);

    // 4. 재생 종료 후 이번 음에 쓰인 모든 일회용 노드 정리
    osc.onended = () => {
        osc.disconnect();
        channels.forEach(({ bpf, channelGain }) => {
            bpf.disconnect();
            channelGain.disconnect();
        });
        voiceGain.disconnect();
    };

    currentSound = { osc, voiceGain };
}
