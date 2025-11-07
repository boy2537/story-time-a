import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Decoding Helpers ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 channel, 24000 sample rate

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
// --- End Audio Decoding Helpers ---


export const generateStory = async (topic: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a creative storyteller for children aged 4-7. Generate a short, happy story about "${topic}" with 5 pages. Each page should be a short paragraph. Respond ONLY with a JSON array of strings, where each string is a page of the story.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A single page of the story text."
          }
        }
      }
    });
    
    const jsonString = response.text.trim();
    const storyPages = JSON.parse(jsonString);
    if (Array.isArray(storyPages) && storyPages.every(p => typeof p === 'string')) {
      return storyPages;
    }
    throw new Error("Invalid story format received from API.");

  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Sorry, I couldn't come up with a story right now. Please try another topic!");
  }
};

export const generateImage = async (pageText: string): Promise<string> => {
    try {
        const prompt = `A whimsical, colorful, simple, and happy illustration for a children's storybook page. The style should be like a cartoon or a gentle watercolor painting. The illustration should depict: "${pageText}"`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Oops! I couldn't draw a picture for this page.");
    }
};

export const generateSpeech = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say it in a friendly, cheerful, and gentle voice for a child: ${text}` }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error("No audio data received.");
        }
        
        const audioBytes = decode(base64Audio);
        return await decodeAudioData(audioBytes, audioContext);

    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("I'm having a little trouble speaking right now.");
    }
};


let chat: Chat | null = null;

const initializeChat = () => {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a friendly, curious, and patient robot friend named Sparky. You are talking to a young child. Keep your answers simple, short, and encouraging. Use simple words and lots of happy emojis.",
            },
        });
    }
    return chat;
}

export const sendMessageToChat = async (message: string): Promise<string> => {
    try {
        const chatInstance = initializeChat();
        const response: GenerateContentResponse = await chatInstance.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw new Error("Sparky is taking a little nap. Try again in a moment!");
    }
}
