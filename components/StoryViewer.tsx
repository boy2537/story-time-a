import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoryPage } from '../types';
import { generateStory, generateImage, generateSpeech } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { Button } from './common/Button';
import { LeftArrowIcon, RightArrowIcon, PlayIcon, StopIcon } from './common/Icons';

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const StoryViewer: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isLoadingStory, setIsLoadingStory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  const handleStopAudio = useCallback(() => {
    if (currentAudioSource.current) {
      currentAudioSource.current.stop();
      currentAudioSource.current.disconnect();
      currentAudioSource.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleCreateStory = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for the story!');
      return;
    }
    handleStopAudio();
    setIsLoadingStory(true);
    setError(null);
    setStoryPages([]);
    setCurrentPageIndex(0);

    try {
      const texts = await generateStory(topic);
      const initialPages: StoryPage[] = texts.map(text => ({
        text,
        isLoadingImage: true,
        isLoadingAudio: true,
      }));
      setStoryPages(initialPages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingStory(false);
    }
  };

  const loadPageAssets = useCallback(async (index: number) => {
    if (!storyPages[index] || storyPages[index].imageUrl) return; // Already loaded

    const page = storyPages[index];
    const imagePromise = generateImage(page.text).then(imageUrl => ({ imageUrl, error: null })).catch(e => ({ imageUrl: null, error: e.message }));
    const audioPromise = generateSpeech(page.text, audioContext).then(audioBuffer => ({ audioBuffer, error: null })).catch(e => ({ audioBuffer: null, error: e.message }));
    
    const [imageResult, audioResult] = await Promise.all([imagePromise, audioPromise]);

    setStoryPages(prevPages => {
        const newPages = [...prevPages];
        const targetPage = newPages[index];
        if (targetPage) {
            targetPage.isLoadingImage = false;
            targetPage.isLoadingAudio = false;
            if (imageResult.imageUrl) {
                targetPage.imageUrl = imageResult.imageUrl;
            } else {
                console.error("Image generation failed:", imageResult.error);
            }
            if (audioResult.audioBuffer) {
                targetPage.audioBuffer = audioResult.audioBuffer;
            } else {
                 console.error("Audio generation failed:", audioResult.error);
            }
        }
        return newPages;
    });
  }, [storyPages]);


  useEffect(() => {
    if (storyPages.length > 0) {
      loadPageAssets(currentPageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyPages.length, currentPageIndex]);
  
  const handlePlayAudio = () => {
    const page = storyPages[currentPageIndex];
    if (isPlaying) {
      handleStopAudio();
      return;
    }
    if (page && page.audioBuffer) {
      handleStopAudio(); // Stop any previous audio
      const source = audioContext.createBufferSource();
      source.buffer = page.audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        setIsPlaying(false);
        currentAudioSource.current = null;
      };
      source.start();
      currentAudioSource.current = source;
      setIsPlaying(true);
    }
  };
  
  const goToNextPage = () => {
    handleStopAudio();
    if (currentPageIndex < storyPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    handleStopAudio();
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const currentPage = storyPages[currentPageIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      {!storyPages.length && !isLoadingStory && (
        <div className="w-full max-w-lg text-center p-8 bg-white/50 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">What should the story be about?</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateStory()}
              placeholder="e.g., a friendly dragon"
              className="flex-grow p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            />
            <Button onClick={handleCreateStory} disabled={isLoadingStory}>
              Create Story
            </Button>
          </div>
          {error && <p className="text-red-500 mt-4 font-semibold">{error}</p>}
        </div>
      )}

      {isLoadingStory && (
        <div className="flex flex-col items-center gap-4 p-8">
            <Spinner />
            <p className="font-bold text-purple-600 text-lg">Dreaming up a new story...</p>
        </div>
      )}

      {storyPages.length > 0 && (
        <div className="w-full flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md aspect-square bg-blue-100 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center">
            {(currentPage.isLoadingImage) && <Spinner />}
            {currentPage.imageUrl && <img src={currentPage.imageUrl} alt={currentPage.text} className="w-full h-full object-cover" />}
             {!currentPage.isLoadingImage && !currentPage.imageUrl && 
                <div className="text-center p-4 text-slate-500">
                    <p>🎨 Oops! The picture is playing hide-and-seek.</p>
                </div>
            }
          </div>

          <p className="text-center text-lg text-slate-700 max-w-prose bg-white/50 p-4 rounded-xl shadow">
            {currentPage.text}
          </p>

          <div className="flex items-center justify-center gap-4 w-full">
            <Button onClick={goToPrevPage} disabled={currentPageIndex === 0}>
                <LeftArrowIcon />
            </Button>
            <Button 
              onClick={handlePlayAudio} 
              disabled={currentPage.isLoadingAudio || !currentPage.audioBuffer} 
              className="w-32"
            >
              {isPlaying ? <StopIcon/> : <PlayIcon />}
              <span className="ml-2">{isPlaying ? 'Stop' : 'Read Aloud'}</span>
            </Button>
            <Button onClick={goToNextPage} disabled={currentPageIndex === storyPages.length - 1}>
                <RightArrowIcon />
            </Button>
          </div>
          <p className="text-slate-500 font-semibold">Page {currentPageIndex + 1} of {storyPages.length}</p>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
