import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SOLVED_SOUND, SOLVED_NOTES, SOLVED_SOUNDS } from './puzzleSounds';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

/** A fresh copy of the module, so it makes its audio context from the fake of this test. */
const fresh = () => import('./puzzleSounds');

function fakeAudio() {
    const oscillators: { frequency: { value: number } }[] = [];
    const sources: unknown[] = [];
    const node = () => ({ connect: (next: unknown) => next });
    class FakeContext {
        currentTime = 10;
        sampleRate = 8000;
        destination = {};
        resume = vi.fn(() => Promise.resolve());
        createOscillator() {
            const o = {
                ...node(),
                type: '',
                frequency: { value: 0 },
                start: vi.fn(),
                stop: vi.fn(),
            };
            oscillators.push(o);
            return o;
        }
        createGain() {
            return {
                ...node(),
                gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            };
        }
        createBiquadFilter() {
            return {
                ...node(),
                Q: { value: 0 },
                frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            };
        }
        createBuffer(_channels: number, length: number) {
            return { getChannelData: () => new Float32Array(length) };
        }
        createBufferSource() {
            const s = { ...node(), buffer: null, start: vi.fn(), stop: vi.fn() };
            sources.push(s);
            return s;
        }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext });
    return { oscillators, sources };
}

describe('puzzle sounds', () => {
    it('defaults to the warm chord', () => {
        expect(DEFAULT_SOLVED_SOUND).toBe('chord');
    });

    it('describes every solved sound it can play, and Off', () => {
        for (const option of SOLVED_SOUNDS.filter((o) => o.id !== 'off')) {
            expect(SOLVED_NOTES[option.id as keyof typeof SOLVED_NOTES].length).toBeGreaterThan(0);
        }
        expect(SOLVED_SOUNDS.at(-1)?.id).toBe('off');
    });

    it('plays the four notes of the warm chord', async () => {
        const { oscillators } = fakeAudio();
        const { playSolvedSound } = await fresh();
        playSolvedSound('chord');
        expect(oscillators.map((o) => Math.round(o.frequency.value))).toEqual([
            523, 659, 784, 1047,
        ]);
    });

    it('plays a whoosh from filtered noise, with a low hum under it', async () => {
        const { oscillators, sources } = fakeAudio();
        const { playWhoosh } = await fresh();
        playWhoosh();
        expect(sources).toHaveLength(1);
        expect(oscillators.map((o) => o.frequency.value)).toEqual([180]);
    });

    it('plays the default for a choice that is no longer offered', async () => {
        const { oscillators } = fakeAudio();
        const { playSolvedSound } = await fresh();
        playSolvedSound('level' as never);
        expect(oscillators.map((o) => Math.round(o.frequency.value))).toEqual([
            523, 659, 784, 1047,
        ]);
    });

    it('plays a single clean bell for Classic ding', async () => {
        const { oscillators } = fakeAudio();
        const { playSolvedSound } = await fresh();
        playSolvedSound('ding');
        expect(oscillators.map((o) => Math.round(o.frequency.value))).toEqual([1568, 4328, 8467]);
    });

    it('makes no sound when the solved sound is off, and no fuss where there is no audio', async () => {
        const { oscillators } = fakeAudio();
        const { playSolvedSound, playWhoosh } = await fresh();
        playSolvedSound('off');
        expect(oscillators).toHaveLength(0);

        vi.stubGlobal('window', {});
        expect(() => playSolvedSound('chord')).not.toThrow();
        expect(() => playWhoosh()).not.toThrow();
    });
});
