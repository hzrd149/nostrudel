import { BehaviorSubject, Subject } from "rxjs";

export interface TextChunk {
  text: string;
  start: number;
  end: number;
}

export interface ReaderState {
  isPlaying: boolean;
  currentChunkIndex: number;
  progress: number;
  isCompleted: boolean;
}

export interface VoiceSettings {
  selectedVoice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export class ArticleSpeechReader {
  private chunks: TextChunk[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Observable state
  public readonly state$ = new BehaviorSubject<ReaderState>({
    isPlaying: false,
    currentChunkIndex: 0,
    progress: 0,
    isCompleted: false,
  });

  public readonly voiceSettings$ = new BehaviorSubject<VoiceSettings>({
    selectedVoice: "",
    rate: 1,
    pitch: 1,
    volume: 1,
  });

  // Error stream
  public readonly error$ = new Subject<string>();

  // Getter for easy access to current state
  public get state(): ReaderState {
    return this.state$.value;
  }

  constructor(chunks: TextChunk[]) {
    this.chunks = chunks;
    this.initializeDefaultVoice();
  }

  private initializeDefaultVoice(): void {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        const defaultVoice = availableVoices.find((voice) => voice.lang.startsWith("en")) || availableVoices[0];
        if (defaultVoice) {
          this.updateVoiceSettings({ selectedVoice: defaultVoice.name });
        }
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  public updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    const currentSettings = this.voiceSettings$.value;
    const newSettings = { ...currentSettings, ...settings };
    this.voiceSettings$.next(newSettings);
  }

  public play(): void {
    if (!this.chunks.length) {
      this.error$.next("No chunks available to play");
      return;
    }

    // If we have a current utterance and we're not playing, resume it
    if (this.currentUtterance && !this.state.isPlaying) {
      this.updateState({ isPlaying: true });
      speechSynthesis.resume();
    } else {
      // Start reading the current chunk
      this.updateState({ isPlaying: true });
      this.readCurrentChunk();
    }
  }

  public pause(): void {
    if (this.state.isPlaying) {
      speechSynthesis.pause();
      this.updateState({ isPlaying: false });
    }
  }

  public stop(): void {
    speechSynthesis.cancel();
    this.currentUtterance = null;
    this.updateState({
      isPlaying: false,
      currentChunkIndex: 0,
      isCompleted: false,
    });
  }

  public readNext(): void {
    if (this.state.currentChunkIndex < this.chunks.length - 1) {
      const newChunkIndex = this.state.currentChunkIndex + 1;
      this.updateState({ currentChunkIndex: newChunkIndex });

      if (this.state.isPlaying) {
        speechSynthesis.cancel();
        this.readCurrentChunk();
      }
    } else {
      // Reached the end
      this.updateState({
        isPlaying: false,
        isCompleted: true,
      });
    }
  }

  public readPrevious(): void {
    if (this.state.currentChunkIndex > 0) {
      const newChunkIndex = this.state.currentChunkIndex - 1;
      this.updateState({ currentChunkIndex: newChunkIndex });

      if (this.state.isPlaying) {
        speechSynthesis.cancel();
        this.readCurrentChunk();
      }
    }
  }

  public seekToChunk(chunkIndex: number): void {
    if (chunkIndex >= 0 && chunkIndex < this.chunks.length) {
      this.updateState({ currentChunkIndex: chunkIndex });

      if (this.state.isPlaying) {
        speechSynthesis.cancel();
        this.readCurrentChunk();
      }
    }
  }

  public seekToProgress(progress: number): void {
    const chunkIndex = Math.floor((progress / 100) * this.chunks.length);
    this.seekToChunk(chunkIndex);
  }

  public getCurrentChunk(): TextChunk | null {
    return this.chunks[this.state.currentChunkIndex] || null;
  }

  public getTotalChunks(): number {
    return this.chunks.length;
  }

  private readCurrentChunk(): void {
    if (this.state.currentChunkIndex >= this.chunks.length) {
      this.updateState({
        isPlaying: false,
        isCompleted: true,
      });
      return;
    }

    const chunk = this.chunks[this.state.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk.text);

    // Apply voice settings
    const settings = this.voiceSettings$.value;

    // Set voice
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === settings.selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech parameters
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onend = () => {
      if (this.state.isPlaying) {
        this.readNext();
      }
    };

    utterance.onerror = (event) => {
      if (event.error === "interrupted") return;

      console.error("Speech synthesis error:", event);
      this.updateState({ isPlaying: false });
      this.error$.next(event.error || "An error occurred during speech synthesis");
    };

    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  private updateState(updates: Partial<ReaderState>): void {
    const currentState = this.state$.value;
    const progress =
      this.chunks.length > 0
        ? ((updates.currentChunkIndex ?? currentState.currentChunkIndex) / this.chunks.length) * 100
        : 0;

    const newState: ReaderState = {
      ...currentState,
      ...updates,
      progress,
    };

    this.state$.next(newState);
  }

  public destroy(): void {
    speechSynthesis.cancel();
    this.state$.complete();
    this.voiceSettings$.complete();
    this.error$.complete();
    speechSynthesis.onvoiceschanged = null;
  }
}
