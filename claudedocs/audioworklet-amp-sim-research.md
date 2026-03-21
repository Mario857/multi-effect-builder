# AudioWorklet Guitar Amp Simulation Research

Research Date: 2026-03-21
Confidence Level: High (0.85) -- based on multiple corroborating academic and practical sources

---

## 1. AudioWorklet Architecture for Real-Time Guitar Amp Simulation

### The Performance Budget

At 44.1kHz, the AudioWorklet processes audio in fixed blocks of **128 samples** (the Web Audio spec mandates this). That gives you:

- **128 / 44100 = ~2.9ms** per block to do all your processing
- In practice, Chrome's audio thread scheduler gives you roughly **2.5-2.7ms** of usable time after overhead
- Per sample: **~22.7 microseconds** (128 samples in 2.9ms)

That 2.9ms is a hard deadline. Miss it, and you get audio glitches (clicks, pops, dropouts). There is no graceful degradation.

### Operations Per Sample -- Realistic Estimates

The question "how many operations per sample" depends heavily on whether you use JS or WASM:

**Pure JavaScript in AudioWorklet:**
- Arithmetic operations (add, multiply, tanh approximation): you can realistically do **50-200 operations per sample** before hitting the budget, depending on browser JIT optimization
- The real killer is not raw math but **memory allocation and garbage collection**. A single GC pause can blow your entire buffer
- Rule of thumb from practitioners: a single tube stage modeled as a nonlinear ODE solver (e.g., 4th-order Runge-Kutta) costs ~30-40 operations per sample. Two cascaded stages with tone stack filtering is feasible in JS

**WASM in AudioWorklet:**
- Roughly **2-5x more operations** per sample vs JS for compute-bound DSP
- Eliminates GC pauses entirely (the primary source of audio glitches in JS)
- Realistic budget: **200-800+ operations per sample** depending on WASM optimization level

### Threading Constraints

- AudioWorklet runs on a **dedicated audio rendering thread**, separate from the main thread
- You get **exactly one thread** for all AudioWorklet processors sharing an AudioContext
- No Web Workers, no spawning threads from within the AudioWorklet
- Communication with the main thread is via **MessagePort** (async) or **SharedArrayBuffer + Atomics** (low-latency)
- The audio thread has the **highest scheduling priority** in the browser -- it will not be preempted by layout, paint, or JS execution on the main thread
- Critical rule: **never block, never allocate, never do I/O** in the process() callback

### AudioWorklet Setup Pattern

```
Main Thread                          Audio Thread
-----------                          ------------
audioContext.audioWorklet.addModule('processor.js')
     |
     v
new AudioWorkletNode(ctx, 'amp-processor')
     |                                    |
     | --- constructor options ---------> |
     |                                    v
     |                          AudioWorkletProcessor.constructor()
     |                                    |
     | <-- MessagePort ------------->     |
     |                                    v
     |                          process(inputs, outputs, params)
     |                            called every 128 samples
```

---

## 2. Tube Circuit Modeling Techniques for JS/WASM

### Approach Comparison

| Technique | Quality | CPU Cost | Complexity to Implement | Best For |
|-----------|---------|----------|------------------------|----------|
| Static Waveshaper (current approach) | Low-Medium | Very Low | Trivial | Quick and dirty, already working |
| Polynomial/tanh approximation | Medium | Low | Easy | Upgrading waveshapers incrementally |
| State-Space (Nodal DK) | High | High | Hard | Full circuit accuracy |
| Wave Digital Filters (WDF) | High | Medium-High | Hard | Modular circuit building |
| Neural network (NAM-style) | Very High | Medium | Medium (if using existing models) | "Just sound like the real thing" |

### Wave Digital Filters (WDF)

WDFs model circuits by converting lumped-element components (resistors, capacitors, tubes) into "wave" domain equivalents connected by adaptors. Key properties:

- **Modular**: each circuit element maps to a WDF component. You can literally build a circuit topology in code
- **Bidirectional signal flow**: naturally captures how tube stages load each other (inter-stage coupling)
- **Stability**: passivity-preserving, inherently stable for linear portions
- **Problem**: nonlinear elements (tubes) require iterative solvers at each sample. The R-Adaptor framework (Werner et al., 2015, CCRMA) handles arbitrary topologies with multiple nonlinearities, but each Newton-Raphson iteration per sample adds ~20-30 FLOPs

**For a single triode stage**, a WDF implementation typically needs:
- 1 series adaptor, 1 parallel adaptor, ~5-8 one-port elements
- 2-4 Newton-Raphson iterations per sample for the tube nonlinearity
- Total: ~60-100 operations per sample per stage

**For cascaded stages**, the Modified Block-Wise Method (Macak, 2010) splits multi-stage circuits into per-stage blocks, solving inter-stage loading by considering only adjacent stages. This reduces a 3-stage amp from O(n^3) coupled solver to O(3n) sequential solves.

**Feasibility in WASM**: Yes, absolutely. A 2-3 stage WDF amp model at 44.1kHz fits comfortably within WASM's per-sample budget. At 4x oversampling (176.4kHz), it gets tight but doable for 2 stages.

### Nodal Analysis / Modified Nodal Analysis (DK Method)

David Yeh's DK method derives a nonlinear state-space system directly from a circuit schematic using Modified Nodal Analysis. The result is a set of differential equations solved via trapezoidal rule.

- **Advantage**: very systematic -- you can literally input a netlist and get a simulation
- **Disadvantage**: the resulting system is often dense (lots of matrix operations), making it expensive for real-time. A single triode stage via DK method can require solving a 4x4-8x8 nonlinear system per sample
- **Quality**: excellent, matches SPICE simulations closely
- **Feasibility in WASM**: possible for a single stage, but multi-stage amps push the budget at 44.1kHz. Not recommended for a first implementation

### State-Space Representations

A hybrid approach that pre-computes much of the circuit analysis offline:
- Derive the state-space matrices from the circuit topology
- At runtime, only the nonlinear components need iterative solving
- Linear portions (tone stacks, filters) become matrix multiplications
- **Quality-to-CPU ratio**: arguably the best for complex circuits, because the offline precomputation amortizes the cost
- **Feasibility**: good for WASM. The online portion is mostly matrix-vector multiply + Newton iterations for nonlinearities

### Recommendation for Quality-to-CPU Ratio

**For your project specifically**, ranked by practical implementability:

1. **Neural Amp Modeling (NAM)** -- highest quality for least custom DSP work. NAM's WASM port already exists and runs in AudioWorklet. You would train or download models of real amps. Quality is essentially indistinguishable from the real amp in blind tests.

2. **WDF per-stage modeling** -- best "white box" approach. Modular, understandable, and you can model specific circuits. Good educational value and tweakability. Medium implementation effort.

3. **Enhanced waveshaping with dynamics** -- upgrade your current approach with power supply sag, bias modulation, and cathode bypass cap simulation. Lowest effort, meaningful improvement over static waveshapers.

---

## 3. Key Analog Behaviors Missing from Waveshaper-Only Approach

Your current `ampSimulator.ts` uses static WaveShaperNodes with 4x oversampling plus BiquadFilters for tone shaping. Here is what it cannot capture, ranked by **perceived quality impact**:

### Tier 1: High Impact (these are what separates "digital" from "analog" feel)

**Power Supply Sag**
- What it is: the B+ voltage droops under load (heavy playing), compressing dynamics and creating a "bloom" effect on note attacks
- Why it matters: this is the #1 reason tube amps feel dynamically responsive. It creates natural compression -- hard pick attacks sag the supply, softening the response; light playing stays clean and open
- DSP model: a simple RC low-pass envelope follower on the signal level, modulating the waveshaper's gain. The Fender 5E3 model uses Kirchhoff's current law to derive discrete-time voltage updates:
  ```
  V[n+1] = V[n] + (dV/dt) * Ts
  ```
  where dV/dt depends on current draw (signal level) vs. power supply capacity
- Implementation complexity: **Low**. Can be done in an AudioWorklet with ~10 operations per sample. This is the single highest-value upgrade you can make
- Affects: plate voltage AND screen voltage (screen sags faster due to additional RC filtering)

**Inter-Stage Coupling / Loading Effects**
- What it is: the output impedance of one tube stage loads the input of the next. Tube stages are not independent -- driving the second stage draws current from the first, changing its operating point
- Why it matters: in a real amp, turning up the gain doesn't just clip harder -- it changes the character of *how* it clips, because each stage's bias shifts based on what the next stage demands
- Your current implementation: two independent WaveShaperNodes in series with no interaction. The first stage produces its output curve regardless of what the second stage does
- DSP model: requires sample-by-sample feedback between stages. Cannot be done with WaveShaperNode -- this requires AudioWorklet
- Implementation complexity: **Medium**. Needs a simple state variable tracking the loading effect between stages

**Cathode Bypass Capacitor Dynamics**
- What it is: the cathode bypass cap acts as a frequency-dependent negative feedback mechanism. At low frequencies (where the cap has high impedance), gain is reduced. At high frequencies, the cap shorts the cathode resistor, providing full gain
- Why it matters: this creates the characteristic mid-hump and low-frequency tightness of tube preamps. It is frequency-dependent gain, not just EQ -- the saturation character changes with frequency
- Your current workaround: the static smoothing filter and tone stack partially approximate this, but cannot capture the dynamic interaction between signal level and frequency-dependent gain
- DSP model: a first-order high-pass filter in the feedback path of each stage, with the time constant set by the cathode resistor and bypass cap values (typically RC = 1-10ms)
- Implementation complexity: **Low-Medium** in AudioWorklet

### Tier 2: Medium Impact (noticeable to trained ears, subtle to casual listeners)

**Output Transformer Saturation**
- What it is: the output transformer has a magnetic core that saturates at low frequencies and high signal levels. This creates frequency-dependent compression and even-harmonic generation
- Why it matters: gives power amp distortion its characteristic "thick" quality different from preamp distortion. Low notes saturate the transformer more than high notes
- DSP model: a separate nonlinear function with a frequency-dependent drive (heavier saturation at lower frequencies, modeled by pre-filtering with a low-shelf boost before a soft clipper)
- Implementation complexity: **Medium**. Separate stage after the tone stack with frequency-dependent characteristics

**Bias Drift / Thermal Behavior**
- What it is: tube bias point shifts as the tube heats up. After sustained heavy playing, the tube runs hotter, shifting the operating point and changing the clipping character
- Why it matters: contributes to the "played in" feel of a tube amp warming up, and the gradual tonal shift during a long gig
- DSP model: a very slow envelope follower (time constant in seconds to minutes) modulating the bias offset of the waveshaping function
- Implementation complexity: **Low** in AudioWorklet, but the effect is subtle. Low priority for initial implementation

### Tier 3: Low Impact (completionist territory)

**Grid Current Limiting**
- At extreme signal levels, the tube's grid starts conducting, creating asymmetric clipping and input impedance changes
- Matters mainly for high-gain amps pushed to maximum

**Plate Resistance Variation**
- Tube plate resistance varies with signal, creating a voltage-divider effect with the load that adds subtle compression
- Mostly absorbed into good waveshaper curve design

### Priority Ranking for Implementation

1. **Power supply sag** -- biggest bang for buck, low complexity
2. **Cathode bypass cap dynamics** -- frequency-dependent gain is what makes tubes sound like tubes
3. **Inter-stage coupling** -- requires AudioWorklet but transforms multi-stage behavior
4. **Output transformer saturation** -- worthwhile for power amp realism
5. **Bias drift** -- nice to have, very subtle effect

---

## 4. Existing Open-Source Implementations

### Browser-Based (AudioWorklet)

**Neural Amp Modeler WASM (tone-3000/neural-amp-modeler-wasm)**
- NAM's C++ DSP core compiled to WASM via Emscripten
- Runs inside AudioWorkletProcessor
- Uses Eigen library for neural network inference
- Thousands of free amp models available on tonehunt.org
- Architecture: React + TypeScript UI, C++ WASM DSP core
- This is the most production-ready browser amp sim available
- GitHub: https://github.com/tone-3000/neural-amp-modeler-wasm

**WebAudio Guitar Amplifier Simulator 3 (micbuffa)**
- Multiple versions, latest uses AudioWorklet
- Marshall JCM 800 emulation validated in academic paper (ACM 2018)
- Includes pedal board with chainable effects
- Used in real gigs with professional guitarists
- GitHub: https://github.com/micbuffa/WebAudio-Guitar-Amplifier-Simulator-3

**Web Audio Modules (WAM) 2.0 Ecosystem**
- Plugin standard for web audio (the "VST for the web")
- Multiple amp sim plugins available as WAMs
- Faust-compiled and hand-coded implementations
- Standard host/plugin architecture with AudioWorklet backend
- Site: https://www.webaudiomodules.com

### Compilable to WASM

**Guitarix**
- GNU/Linux virtual guitar amplifier, open source
- Core DSP written in Faust programming language
- Faust code can compile directly to WASM + AudioWorklet
- Includes tube stages, tone stacks, cabinets, effects
- Many individual Faust DSP modules that can be extracted
- GitHub: https://github.com/brummer10/guitarix

**Faust (Functional Audio Stream)**
- Domain-specific language for DSP
- Compiles to: C++, WASM, AudioWorklet, LLVM, and more
- Online IDE can compile Faust code to WASM AudioWorklet in real-time
- faustwasm npm package provides TypeScript bindings
- Large library of existing DSP algorithms including tube models
- GitHub: https://github.com/grame-cncm/faustwasm
- Compile target: `faust2webaudiowasm` generates ready-to-use AudioWorklet nodes

**CAPS (C* Audio Plugin Suite)**
- High-quality amp models in C++
- Could be compiled to WASM with Emscripten
- Includes AmpVTS (tube simulation with tone stack)
- Less actively maintained than Guitarix/Faust

**Neural Amp Modeler (native)**
- Python training pipeline + C++ inference engine
- C++ core already proven compilable to WASM (see tone-3000 above)
- Train models of any real amp with a capture rig
- GitHub: https://github.com/sdatkinson/neural-amp-modeler

### The Faust Path (Most Practical for Your Project)

Faust deserves special attention because:
1. It compiles directly to optimized WASM AudioWorklet nodes
2. Guitarix's DSP is written in Faust, meaning you can extract individual tube stage models
3. The faustwasm npm package integrates cleanly with a JS/TS project
4. You write DSP in a high-level functional language, and Faust handles the optimization
5. The Faust online IDE lets you prototype and test before integrating

Example Faust tube stage (simplified):
```faust
tubeStage(gain) = _ : *(gain) : nonlinearity : dcblock : lowpass
with {
  nonlinearity(x) = ma.tanh(x * 3.0) * 0.7 + ma.tanh(x) * 0.3;
  dcblock = fi.dcblocker;
  lowpass = fi.lowpass(1, 5000);
};
```

---

## 5. WASM vs Pure JS in AudioWorklet

### Can You Run WASM Inside AudioWorkletProcessor?

**Yes.** This is a well-supported, production-proven pattern. Two integration approaches:

**Pattern A: Synchronous Compilation in AudioWorkletGlobalScope**
- WASM module compiled synchronously when the processor module loads
- Simpler setup, works well for smaller WASM modules (<1MB)
- Emscripten flags: `BINARYEN_ASYNC_COMPILATION=0`, `SINGLE_FILE=1`

**Pattern B: Main Thread Compilation + Transfer**
- Compile WASM on main thread (async, non-blocking)
- Transfer compiled module to AudioWorklet via constructor options
- Better for larger modules, avoids blocking audio thread during init

### Performance Comparison

| Metric | Pure JS | WASM (C++) | WASM (Rust) |
|--------|---------|------------|-------------|
| Raw arithmetic throughput | 1x baseline | 2-5x faster | 2-5x faster |
| Memory predictability | GC pauses (0.1-5ms) | Deterministic | Deterministic |
| Worst-case latency | Unpredictable (GC) | Predictable | Predictable |
| Startup time | Instant | 50-200ms compile | 50-200ms compile |
| Debug experience | Excellent (browser devtools) | Poor (no source maps in worklet) | Poor |
| Development speed | Fast | Slow (C++ toolchain) | Medium (Rust toolchain) |

**The GC issue is the critical differentiator.** In JS, even if your average processing time is well within budget, a single garbage collection pause can cause a glitch. WASM eliminates this entirely because it uses its own linear memory heap with no GC.

### Latency Impact

WASM itself adds **zero additional latency** to audio processing. The latency is determined by:
- AudioContext buffer size (typically 128 samples = 2.9ms at 44.1kHz)
- OS audio driver buffer (platform-dependent, typically 5-20ms)
- Browser-specific overhead (Chrome has ~2 extra buffer periods)

Total system latency is typically **8-25ms** depending on platform and browser, regardless of whether you use JS or WASM for DSP.

### Is It Worth the Complexity?

**For your specific situation:**

- If staying with static waveshaping + filters (current approach): **No.** The built-in WaveShaperNode already runs natively, and BiquadFilters are native C++ inside the browser. Adding WASM would not improve performance here.

- If adding sample-by-sample DSP (power supply sag, inter-stage coupling, cathode bypass dynamics): **Yes, strongly recommended.** These algorithms need deterministic per-sample processing. GC pauses in JS would cause audible glitches during sustained playing.

- If integrating NAM or Faust-compiled models: **Mandatory.** These already compile to WASM.

### The Emscripten Path (Recommended)

Emscripten's Wasm Audio Worklets API provides the most mature integration:
- Purpose-built for audio processing in WASM
- Handles the AudioWorkletProcessor boilerplate
- Eliminates all JS-level garbage generation
- Provides lock-free atomics for parameter communication
- Compiler flags: `-sAUDIO_WORKLET -sWASM_WORKERS`

---

## 6. Practical Feasibility Assessment

### Your Current Architecture

Based on reading `src/lib/audio/effects/ampSimulator.ts`, your signal chain is:

```
Input -> HighPass(100Hz) -> LowPass(inputHighCut)
  -> PreampGain -> WaveShaper(4x OS) -> DCBlock
  -> [WaveShaper2(4x OS) -> DCBlock2]  (high-gain only)
  -> SmoothingLP -> PostTrim
  -> Bass(shelf) -> Mid(peak) -> Treble(shelf) -> Presence(peak)
  -> CabBody(peak) -> CabLP1 -> CabLP2
  -> MasterGain -> Output
```

All nodes are native Web Audio API nodes. No AudioWorklet currently.

### Incremental Upgrade Path (Recommended)

You do NOT need to go all-or-nothing. Here is a phased approach:

**Phase 1: Add Power Supply Sag (AudioWorklet, keep everything else)**
- Create a single AudioWorkletProcessor that sits between your PreampGain and WaveShaper
- It tracks the signal envelope and modulates the gain feeding the waveshaper
- Everything downstream (tone stack, cab sim) stays as-is
- Effort: 1-2 days. Immediate improvement in dynamic feel
- Signal chain becomes:
  ```
  ... -> PreampGain -> [SagProcessor] -> WaveShaper -> ...
  ```

**Phase 2: Replace Waveshaper Stages with AudioWorklet**
- Move the waveshaping + DC blocking + cathode bypass cap simulation into the AudioWorklet
- Keep the tone stack and cab sim as native BiquadFilter nodes (they are already excellent for this)
- The AudioWorklet now handles: gain staging, nonlinear waveshaping with frequency-dependent feedback, inter-stage coupling, and power supply sag
- Effort: 3-5 days for JS implementation, 5-8 days for WASM
- Signal chain becomes:
  ```
  Input -> InputFilters(native) -> [TubeStageWorklet] -> ToneStack(native) -> CabSim(native) -> Output
  ```

**Phase 3: WASM Upgrade (optional)**
- Port the AudioWorklet DSP to C++/Rust compiled to WASM
- Or integrate Faust-compiled tube models via faustwasm
- Or integrate NAM WASM for neural amp modeling
- Effort: 5-10 days depending on approach
- Same signal chain, just the worklet internals change

**Phase 4: Full Circuit Model (optional, advanced)**
- Replace tube stage processing with WDF-based circuit model
- Model specific amps (Fender, Marshall, Mesa) from actual schematics
- Effort: weeks to months for quality WDF implementation

### What to Keep vs Replace

| Component | Keep or Replace | Reason |
|-----------|----------------|--------|
| Input HP/LP filters | KEEP | Native BiquadFilters are perfect for this |
| Preamp gain | MOVE to AudioWorklet | Needs to interact with sag model |
| WaveShaperNode | REPLACE with AudioWorklet | Static curve cannot model dynamics |
| DC blockers | MOVE to AudioWorklet | Trivial to implement, should be per-sample |
| Smoothing filter | KEEP or MOVE | Works as native node, but better in worklet for coupling sim |
| Tone stack (Bass/Mid/Treble/Presence) | KEEP | Native BiquadFilters are excellent for tone stacks |
| Cabinet simulation | KEEP | Native filters work well; upgrade to convolution IR later if desired |
| Master gain | KEEP | Native GainNode is fine |

### Architecture Decision

The hybrid approach (AudioWorklet for nonlinear stages + native nodes for linear filtering) is the right call. Reasons:

1. Native BiquadFilterNodes run in optimized C++ inside the browser engine -- you cannot beat their performance
2. The nonlinear tube behavior is where you need sample-by-sample control
3. AudioWorkletNode integrates seamlessly into the Web Audio graph -- it has inputs and outputs just like any other node
4. You can develop and test incrementally without breaking the existing signal chain

---

## 7. Oversampling in AudioWorklet

### The Problem

Your current WaveShaperNodes use `oversample: '4x'` which the browser handles internally and for free (it is implemented in native C++). When you move waveshaping to an AudioWorklet, you lose this free oversampling and must implement it yourself.

### Why Oversampling Matters

Nonlinear operations (clipping, saturation) generate harmonics. A signal at 5kHz put through a hard clipper generates harmonics at 10kHz, 15kHz, 20kHz, 25kHz... At 44.1kHz sample rate, anything above 22.05kHz aliases back down into the audible range as inharmonic artifacts. This is especially ugly during note bends (the aliased frequencies shift in pitch).

**Minimum oversampling for guitar distortion:**
- Clean/light crunch: 2x is often adequate
- Medium gain: 4x (what you have now)
- High gain: 8x minimum, 16x preferred for the best quality
- The EarLevel Engineering reference: "minimum acceptable oversampling factor is 6x; 8x is a good place to start"

### Implementation in AudioWorklet

The oversampling process:
1. **Upsample**: insert zeros between samples, then apply anti-imaging lowpass filter
2. **Process**: run nonlinear function at the higher rate
3. **Downsample**: apply anti-aliasing lowpass filter, then decimate (take every Nth sample)

```
Input (128 samples at 44.1kHz)
  |
  v
Upsample 4x -> 512 samples at 176.4kHz
  |
  v
Anti-imaging lowpass filter (512 samples)
  |
  v
Nonlinear processing (512 samples) <-- your tube model runs here
  |
  v
Anti-aliasing lowpass filter (512 samples)
  |
  v
Decimate 4x -> 128 samples at 44.1kHz
  |
  v
Output
```

### CPU Cost

Oversampling multiplies your per-sample work by the oversampling factor:

| Factor | Samples per block | Operations (simple tanh) | Operations (WDF stage) | Feasible in JS? | Feasible in WASM? |
|--------|------------------|--------------------------|------------------------|-----------------|-------------------|
| 1x | 128 | ~128 | ~8,000-12,800 | Yes | Yes |
| 2x | 256 | ~512 | ~16,000-25,600 | Yes | Yes |
| 4x | 512 | ~2,048 | ~32,000-51,200 | Tight | Yes |
| 8x | 1024 | ~8,192 | ~64,000-102,400 | No | Tight |

The oversampling filters themselves add overhead too. Per block:
- FIR anti-alias filter (reasonable quality, ~32 taps): 32 * N_oversampled multiplies + adds
- IIR filters are cheaper (~6-8 ops per sample) but introduce phase distortion

### Practical Recommendations

1. **Start with 4x oversampling** to match your current quality level
2. Use **IIR filters** (Butterworth or Chebyshev Type I) for the anti-aliasing -- cheaper than FIR and good enough for guitar
3. **Only oversample the nonlinear section**, not the entire signal chain. The tone stack and cab sim run at native rate
4. In WASM, 4x oversampling of a single tube stage costs roughly 15-25% of your per-block budget -- very comfortable
5. For high-gain (2 stages), 4x oversampling in WASM still fits within budget. 8x would require careful optimization

### Polyphase Implementation

For efficiency, use polyphase decomposition of the anti-aliasing filter. Instead of upsampling then filtering (wasteful -- most of the upsampled samples are zeros), you run a shorter filter that only computes the non-zero contributions. This cuts the filter cost by a factor of N (the oversampling ratio).

---

## Summary: Effort/Reward Tradeoff Matrix

| Upgrade | Effort | Reward (Sound Quality) | Reward (Feel/Dynamics) | Requires AudioWorklet? | Requires WASM? |
|---------|--------|----------------------|----------------------|----------------------|----------------|
| Power supply sag | Low (1-2 days) | Small | **Large** | Yes | No (but recommended) |
| Cathode bypass dynamics | Low-Med (2-3 days) | Medium | Medium | Yes | No |
| Inter-stage coupling | Medium (3-5 days) | Medium | Medium | Yes | No |
| Custom oversampling | Medium (2-3 days) | Medium (matches current) | None | Yes | Recommended for 8x+ |
| Output transformer sat | Medium (3-4 days) | Medium | Small | Yes | No |
| WDF circuit modeling | High (weeks) | High | High | Yes | Yes |
| NAM integration | Medium (5-8 days) | **Very High** | **Very High** | Yes | Yes (already done) |
| Faust integration | Medium (3-5 days) | High | High | Yes | Yes (Faust compiles it) |

### Recommended Path

1. Phase 1 (immediate win): AudioWorklet with power supply sag + custom oversampled waveshaping in JS. Keep native tone stack and cab sim. **~3-4 days of work.**
2. Phase 2 (meaningful upgrade): Add cathode bypass dynamics and inter-stage coupling to the AudioWorklet. Port DSP to WASM for reliability. **~5-7 additional days.**
3. Phase 3 (significant leap): Either integrate NAM WASM for neural modeling, or adopt Faust-compiled tube models from Guitarix. **~5-10 additional days.**

---

## Sources

- [AudioWorklet Performance Optimization - Casey Primozic](https://cprimozic.net/blog/webaudio-audioworklet-optimization/)
- [Audio Worklet Design Patterns - Chrome Developers](https://developer.chrome.com/blog/audio-worklet-design-pattern/)
- [AudioWorkletProcessor: process() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process)
- [Emscripten Wasm Audio Worklets API](https://emscripten.org/docs/api_reference/wasm_audio_worklets.html)
- [WDF Guitar Amp Simulation - CCRMA Stanford](https://ccrma.stanford.edu/~jingjiez/portfolio/gtr-amp-sim/index.html)
- [Guitar Amp Simulation - EarLevel Engineering](https://www.earlevel.com/main/2017/05/26/guitar-amp-simulation/)
- [Digital Modeling of Guitar Amp Power Supply - AmpBooks](https://www.ampbooks.com/mobile/dsp/power-supply/)
- [What is Sag? - Aiken Amps](https://www.aikenamps.com/index.php/what-is-sag)
- [Neural Amp Modeler WASM - GitHub](https://github.com/tone-3000/neural-amp-modeler-wasm)
- [NAM Web Player - TONE3000](https://www.tone3000.com/blog/introducing-the-nam-web-player)
- [WebAudio Guitar Amplifier Simulator 3 - GitHub](https://github.com/micbuffa/WebAudio-Guitar-Amplifier-Simulator-3)
- [Real-Time Emulation of Marshall JCM 800 in Browser - ACM](https://dl.acm.org/doi/fullHtml/10.1145/3184558.3186973)
- [Faust Programming Language](https://faust.grame.fr/)
- [faustwasm - GitHub](https://github.com/grame-cncm/faustwasm)
- [FAUST Compiled to WebAssembly - ACM](https://dl.acm.org/doi/fullHtml/10.1145/3184558.3185970)
- [Guitarix - GNU/Linux Virtual Amplifier](https://guitarix.org/)
- [Web Audio Modules 2.0](https://www.webaudiomodules.com/docs/intro/)
- [Oversampling in Distortion Effects - Science of Sound](https://science-of-sound.net/2016/06/oversampling-distortion-effects/)
- [From Blues to Rock to Jazz - Web Audio Tube Guitar Amp Plugins (ResearchGate)](https://www.researchgate.net/publication/361720643_From_blues_to_rock_to_jazz_three_different_web_audio_tube_guitar_amplifier_simulator_plugins)
- [Enhanced Wave Digital Triode Model - IEEE](https://ieeexplore.ieee.org/abstract/document/5272282/)
- [Cathode Bypass Capacitor Explained - Audio Workshop](https://blog.audioworkshop.org/the-cathode-bypass-capacitor-explained/)
