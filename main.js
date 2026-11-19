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

function playVowelSound1() {
    const now = ctx.currentTime;

    const osc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 120 });
    const gainNode = new GainNode(ctx, { gain: 0.2 });
    const compressor = new DynamicsCompressorNode(ctx, {
        threshold: -24, // 기본값: -24 (범위: -100 ~ 0 dB)
        knee: 30,       // 기본값: 30  (범위: 0 ~ 40 dB)
        ratio: 20,      // 기본값: 12  (범위: 1 ~ 20)
        attack: 0.003,  // 기본값: 0.003 (범위: 0 ~ 1 초)
        release: 0.25   // 기본값: 0.25  (범위: 0 ~ 1 초)
    });

    const formants = [[730, 15], [1090, 15], [2440, 12]];

    formants
        .map(([frequency, Q]) => new BiquadFilterNode(ctx, { type: 'lowpass', frequency, Q }))
        .reduce((prev, curr) => prev.connect(curr), osc)
        .connect(compressor)
        .connect(gainNode)
        .connect(ctx.destination);

    osc.start();
    osc.stop(now + 1.0);
}

function playVowelSound2(vowelChar) {
    const now = ctx.currentTime;

    const osc = new OscillatorNode(ctx, { type: 'sawtooth', frequency: 120 })
    const compressor = new DynamicsCompressorNode(ctx, {
        threshold: -24,
        knee: 30,
        ratio: 20,
        attack: 0.003,
        release: 0.15
    });
    const masterGain = new GainNode(ctx, { gain: 0.2 })

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

    const formants = VOWEL_PRESETS[vowelChar] // [[730, 10, 1], [1090, 15, 0.4]]

    const channels = formants.map(([frequency, Q, gain]) => {
        const bpf = new BiquadFilterNode(ctx, {
            type: 'bandpass',
            frequency,
            Q
        });

        const channelGain = new GainNode(ctx, { gain });

        osc
            .connect(bpf)
            .connect(channelGain)
            .connect(compressor);

        return { bpf, channelGain };
    });

    compressor
        .connect(masterGain)
        .connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.75);
}
