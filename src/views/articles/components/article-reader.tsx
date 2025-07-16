import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  CardProps,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Link,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAsync, useUnmount } from "react-use";
import { remark } from "remark";
import stripMarkdown from "strip-markdown";

import { ArticleSpeechReader, ReaderState, TextChunk, VoiceSettings } from "../../../classes/article-speech-reader";
import { SettingsIcon } from "../../../components/icons";
import PauseIcon from "../../../components/icons/pause-square";
import PlayIcon from "../../../components/icons/play";
import { CAP_IS_ANDROID, IS_WEB_ANDROID } from "../../../env";

function ArticleReader({
  markdown,
  ...props
}: {
  markdown: string;
} & Omit<CardProps, "children">) {
  const readerRef = useRef<ArticleSpeechReader | null>(null);
  const [readerState, setReaderState] = useState<ReaderState>({
    isPlaying: false,
    currentChunkIndex: 0,
    progress: 0,
    isCompleted: false,
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    selectedVoice: "",
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const toast = useToast();

  // Convert markdown to plain text and create chunks
  const {
    value: chunks,
    error: processingError,
    loading: processingLoading,
  } = useAsync(async () => {
    if (!markdown) return [];

    const result = await remark().use(stripMarkdown).process(markdown);
    const plainText = result.toString();

    // Split text into chunks based on sentences and paragraphs
    const sentences = plainText.split(/(?<=[.!?])\s+/);
    const textChunks: TextChunk[] = [];
    let currentPosition = 0;

    for (const sentence of sentences) {
      if (sentence.trim()) {
        const start = currentPosition;
        const end = currentPosition + sentence.length;
        textChunks.push({
          text: sentence.trim(),
          start,
          end,
        });
        currentPosition = end + 1;
      }
    }

    return textChunks;
  }, [markdown]);

  // Initialize voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Create reader instance when chunks change
  useEffect(() => {
    if (chunks && chunks.length > 0) {
      // Destroy previous reader
      if (readerRef.current) {
        readerRef.current.destroy();
      }

      // Create new reader
      const reader = new ArticleSpeechReader(chunks);
      readerRef.current = reader;

      // Subscribe to state changes
      const stateSubscription = reader.state$.subscribe(setReaderState);
      const voiceSettingsSubscription = reader.voiceSettings$.subscribe(setVoiceSettings);
      const errorSubscription = reader.error$.subscribe((error) => {
        toast({
          title: "Speech Error",
          description: error,
          status: "error",
        });
      });

      return () => {
        stateSubscription.unsubscribe();
        voiceSettingsSubscription.unsubscribe();
        errorSubscription.unsubscribe();
      };
    }
  }, [chunks, toast]);

  // Cleanup on unmount
  useUnmount(() => {
    readerRef.current?.destroy();
  });

  // Event handlers
  const togglePlayPause = useCallback(() => {
    if (!readerRef.current) return;
    if (readerState.isPlaying) {
      readerRef.current.pause();
    } else {
      readerRef.current.play();
    }
  }, [readerState.isPlaying]);

  const handleProgressChange = useCallback((value: number) => {
    readerRef.current?.seekToProgress(value);
  }, []);

  const handleVoiceChange = useCallback((selectedVoice: string) => {
    readerRef.current?.updateVoiceSettings({ selectedVoice });
  }, []);

  const handleRateChange = useCallback((rate: number) => {
    readerRef.current?.updateVoiceSettings({ rate });
  }, []);

  const handlePitchChange = useCallback((pitch: number) => {
    readerRef.current?.updateVoiceSettings({ pitch });
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    readerRef.current?.updateVoiceSettings({ volume });
  }, []);

  // Handle processing error
  if (processingError) {
    return (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>Failed to process markdown content: {processingError.message}</AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  // Handle loading state
  if (processingLoading || !chunks || chunks.length === 0) {
    return (
      <Box p={4}>
        <Text>Processing article...</Text>
      </Box>
    );
  }

  return (
    <Card display="flex" flexDirection="column" gap="2" p="4" variant="elevated" w="full" {...props}>
      {/* Progress Bar */}
      <Flex gap="4" alignItems="center" w="full">
        <IconButton
          aria-label={readerState.isPlaying ? "Pause" : "Play"}
          icon={readerState.isPlaying ? <PauseIcon boxSize={5} /> : <PlayIcon boxSize={5} />}
          onClick={togglePlayPause}
          colorScheme={readerState.isPlaying ? "blue" : "green"}
          rounded="full"
        />
        <Flex direction="column" flex={1} pl="2">
          <Slider
            value={readerState.progress}
            onChange={handleProgressChange}
            min={0}
            max={100}
            step={1}
            colorScheme="primary"
            size="lg"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <HStack justifyContent="space-between">
            <Text fontSize="sm" color="gray.600">
              {readerState.currentChunkIndex + 1} / {readerRef.current?.getTotalChunks() || 0} chunks
            </Text>
            <Text fontSize="sm" color="gray.600">
              {Math.round(readerState.progress)}%
            </Text>
          </HStack>
        </Flex>

        <IconButton
          aria-label="Toggle settings"
          icon={<SettingsIcon boxSize={6} />}
          variant="ghost"
          rounded="full"
          onClick={() => setShowSettings(!showSettings)}
        />
      </Flex>

      {/* Current Text Display */}
      {readerState.isPlaying && (
        <Text fontSize="sm" fontStyle="italic">
          {readerRef.current?.getCurrentChunk()?.text || ""}
        </Text>
      )}

      {/* Settings Section */}
      <Collapse in={showSettings} animateOpacity>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Voice</FormLabel>
            <Select value={voiceSettings.selectedVoice} onChange={(e) => handleVoiceChange(e.target.value)}>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </Select>
          </FormControl>

          <Grid width="full" gap={2} templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-2xs), 1fr))">
            <FormControl>
              <FormLabel>Speed (x{voiceSettings.rate.toFixed(1)})</FormLabel>
              <Slider
                value={voiceSettings.rate}
                onChange={handleRateChange}
                min={0.5}
                max={2}
                step={0.1}
                colorScheme="blue"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>

            <FormControl>
              <FormLabel>Pitch (x{voiceSettings.pitch.toFixed(1)})</FormLabel>
              <Slider
                value={voiceSettings.pitch}
                onChange={handlePitchChange}
                min={0.5}
                max={2}
                step={0.1}
                colorScheme="blue"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>

            <FormControl>
              <FormLabel>Volume ({Math.round(voiceSettings.volume * 100)}%)</FormLabel>
              <Slider
                value={voiceSettings.volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                colorScheme="blue"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
          </Grid>

          {(IS_WEB_ANDROID || CAP_IS_ANDROID) && (
            <Text fontStyle="italic">
              If the default voices sound terrible, try{" "}
              <Link href="https://f-droid.org/packages/org.woheller69.ttsengine/" isExternal color="blue.500">
                SherpaTTS
              </Link>
              . Its a small open source app for running local AI Text-to-Speech engines.
            </Text>
          )}
        </VStack>
      </Collapse>
    </Card>
  );
}

export default ArticleReader;
