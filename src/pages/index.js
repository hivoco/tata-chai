// // pages/index.js
// import { useState, useEffect, useRef, useCallback } from "react";
// import Head from "next/head";
// import { MicrophoneIcon, StopIcon } from "@heroicons/react/solid";
// import { speakText } from "@/pages/utiles/speechSynthesis";
// import Image from "next/image";

// export default function Home() {
//   const [isListening, setIsListening] = useState(false);
//   const [transcript, setTranscript] = useState("");
//   const [response, setResponse] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const audioRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const speechTimeoutRef = useRef(null);
//   const [isSpeechDetected, setIsSpeechDetected] = useState(false);

//   const handleQuerySubmission = useCallback(
//     async (text) => {
//       console.log("handleQuerySubmission called with:", text || transcript);
//       const queryText = text || transcript;
//       if (!queryText.trim()) {
//         console.log("Empty query text, returning");
//         return;
//       }

//       console.log("Setting loading state");
//       setIsLoading(true);
//       try {
//         console.log("Would call API with:", queryText);

//         const apiResponse = await fetch(
//           "http://192.168.1.10:5000/api/get_audio_text",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ text: queryText }),
//           }
//         );

//         if (!apiResponse.ok) {
//           throw new Error("Failed to get response from API");
//         }

//         const data = await apiResponse.json();
//         console.log(data);

//         // For now, using the hardcoded response
//         //  console.log("Using hardcoded response");
//         //  const data = {
//         //    text: "Hello how are you",
//         //    audioUrl:
//         //      "https://videoforinteractivedemons.s3.ap-south-1.amazonaws.com/bank_audio/retirement.mp3",
//         //  };
//         setResponse(data.text);

//         // Play the audio from S3 link (data.audioUrl comes from our API handler)

//         // Check if the response has empty audioUrl or text
//         if (!data.text || !data.audioUrl) {
//           console.log("Empty response data, restarting listening");
//           setResponse(data.text || "No response received");
//           // If either audioUrl or text is empty, restart listening
//           if (recognitionRef.current) {
//             setTimeout(() => {
//               recognitionRef.current.start();
//               setIsListening(true);
//             }, 300);
//           }
//           return;
//         }
//         if (data.audioUrl) {
//           if (audioRef.current) {
//             audioRef.current.src = data.audioUrl;
//             setIsPlaying(true);

//             try {
//               await audioRef.current.play();
//             } catch (error) {
//               console.error("Audio playback error:", error);
//               // Fallback to speech synthesis if audio playback fails
//               setIsPlaying(true);
//               try {
//                 await speakText(data.text);
//               } catch (synthError) {
//                 console.error("Speech synthesis error:", synthError);
//               } finally {
//                 setIsPlaying(false);
//               }
//             }
//           }
//         } else {
//           // Use browser's speech synthesis if no audio URL is provided
//           setIsPlaying(true);
//           try {
//             await speakText(data.text);
//           } catch (error) {
//             console.error("Speech synthesis error:", error);
//           } finally {
//             setIsPlaying(false);
//           }
//         }
//       } catch (error) {
//         console.error("Error getting response:", error);
//         setResponse("Sorry, there was an error processing your request.");
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [transcript]
//   );
//   // Restart listening when conditions allow
//   useEffect(() => {
//     if (!isListening && !isLoading && !isPlaying && recognitionRef.current) {
//       // If we're not listening, loading, or playing, restart listening
//       setTimeout(() => {
//         recognitionRef.current.start();
//         setIsListening(true);
//       }, 300);
//     }
//   }, [isListening, isLoading, isPlaying]);

//   // Configure audio element
//   useEffect(() => {
//     if (audioRef.current) {
//       // Set audio element to stop any current playing and try to play immediately when src changes
//       audioRef.current.preload = "auto";
//       audioRef.current.oncanplaythrough = () => {
//         if (!audioRef.current.paused) return;
//         audioRef.current.play().catch((err) => {
//           console.error("Audio autoplay failed:", err);
//         });
//       };
//     }
//   }, []);

//   // Setup speech recognition - do this only once on component mount to avoid recreation
//   useEffect(() => {
//     // Initialize speech recognition on client side only
//     if (
//       (typeof window !== "undefined" && "SpeechRecognition" in window) ||
//       "webkitSpeechRecognition" in window
//     ) {
//       const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = true;

//       // Set a longer timeout for speech recognition
//       // Default is often too short (5 seconds)
//       recognitionRef.current.maxAlternatives = 1;

//       // These are important for consistency across browsers
//       if (typeof recognitionRef.current.lang === "string") {
//         recognitionRef.current.lang = "en-US";
//       }

//       console.log("Speech recognition initialized");
//     }

//     // Cleanup on unmount
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, []); // Empty dependency array = only on mount

//   // Handle speech recognition events with access to current state
//   useEffect(() => {
//     if (!recognitionRef.current) return;

//     // Speech timeout reference - to detect when user stops speaking

//     // Function to clear the speech timeout
//     const clearSpeechTimeout = () => {
//       if (speechTimeoutRef.current) {
//         clearTimeout(speechTimeoutRef.current);
//         speechTimeoutRef.current = null;
//       }
//     };

//     // Define event handlers
//     const handleResult = (event) => {
//       const current = event.resultIndex;
//       const transcriptText = event.results[current][0].transcript;
//       console.log("Speech detected:", transcriptText);
//       setTranscript(transcriptText);
//       setIsSpeechDetected(true);

//       // Reset the speech timeout whenever we get a result
//       clearSpeechTimeout();

//       // Set a new timeout - if no new speech is detected in 1.5 seconds,
//       // we'll consider the user done speaking
//       speechTimeoutRef.current = setTimeout(() => {
//         console.log("Speech timeout - user finished speaking");

//         // Stop recognition to trigger the onend handler
//         if (recognitionRef.current) {
//           recognitionRef.current.stop();
//         }
//       }, 1500); // 1.5 seconds of silence = done speaking
//     };

//     const handleEnd = () => {
//       // Clear any pending speech timeout
//       clearSpeechTimeout();

//       console.log("Speech recognition ended", {
//         isListening,
//         isSpeechDetected,
//         transcript,
//       });

//       // Only call the API when speech was detected
//       if (isSpeechDetected) {
//         console.log("Speech detected, calling API");
//         setIsSpeechDetected(false);
//         handleQuerySubmission(transcript);
//       } else if (isListening && !isLoading && !isPlaying) {
//         // Just restart listening if no speech was detected
//         console.log("No speech detected, restarting recognition");
//         recognitionRef.current.start();
//       }
//     };

//     // Handle speech recognition error
//     const handleError = (event) => {
//       console.error("Speech recognition error:", event.error);
//       // Clear any pending speech timeout
//       clearSpeechTimeout();
//     };

//     // Attach event handlers
//     recognitionRef.current.onresult = handleResult;
//     recognitionRef.current.onend = handleEnd;
//     recognitionRef.current.onerror = handleError;

//     return () => {
//       // Clear any pending speech timeout on cleanup
//       clearSpeechTimeout();
//     };
//   }, [
//     isListening,
//     isLoading,
//     isPlaying,
//     isSpeechDetected,
//     transcript,
//     handleQuerySubmission,
//   ]);

//   const toggleListening = () => {
//     if (isListening) {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//       setIsListening(false);
//     } else {
//       setResponse("");
//       setTranscript("");
//       setIsSpeechDetected(false);
//       if (recognitionRef.current) {
//         recognitionRef.current.start();
//         setIsListening(true);
//       } else {
//         alert("Speech recognition is not supported in your browser.");
//       }
//     }
//   };

//   // Handle when audio playback ends
//   useEffect(() => {
//     const handleAudioEnded = () => {
//       setIsPlaying(false);
//       // Resume listening after audio playback
//       if (recognitionRef.current) {
//         setTimeout(() => {
//           recognitionRef.current.start();
//           setIsListening(true);
//         }, 500);
//       }
//     };

//     if (audioRef.current) {
//       audioRef.current.addEventListener("ended", handleAudioEnded);
//     }

//     return () => {
//       if (audioRef.current) {
//         audioRef.current.removeEventListener("ended", handleAudioEnded);
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-900 to-purple-800">
//       <Head>
//         <title>Voice Assistant</title>
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <main className="flex flex-col items-center justify-center flex-1 px-4 text-center">
//         <h1 className="text-4xl font-bold mb-8 text-white">
//           Tata Tea Voice Assistant
//         </h1>

//         <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden p-6">
//           <div className="relative mb-6">
//             <button
//               onClick={toggleListening}
//               disabled={isLoading}
//               className={`relative mx-auto w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 ${
//                 isListening
//                   ? "bg-red-500 animate-pulse"
//                   : isLoading
//                   ? "bg-amber-500"
//                   : isPlaying
//                   ? "bg-green-500"
//                   : "bg-blue-500 hover:bg-blue-600"
//               }`}
//             >
//               {isListening ? (
//                 <StopIcon className="h-10 w-10 text-white" />
//               ) : isLoading ? (
//                 <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
//               ) : (
//                 <MicrophoneIcon className="h-10 w-10 text-white" />
//               )}

//               {isListening && (
//                 <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-75"></span>
//               )}
//             </button>

//             <div className="mt-3 h-6 text-center">
//               {isListening  && (

//                 <p className="text-sm text-blue-600 font-medium">
//                   Listening...
//                 </p>
//               )}
//               {isLoading && (
//                 <p className="text-sm text-amber-600 font-medium">
//                   Processing...
//                 </p>
//               )}
//               {isPlaying && (
//                 <p className="text-sm text-green-600 font-medium">
//                   Speaking...
//                 </p>
//               )}
//             </div>
//           </div>

//           {transcript && (
//             <div className="mb-6 p-4 bg-gray-100 rounded-lg">
//               <h2 className="text-sm font-semibold text-black mb-2">
//                 You said:
//               </h2>
//               <p className="text-lg text-gray-700">{transcript}</p>
//             </div>
//           )}

//           {response && (
//             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
//               <h2 className="text-sm font-semibold text-blue-700 mb-2">
//                 Response:
//               </h2>
//               <p className="text-lg text-gray-700">{response}</p>
//             </div>
//           )}

//           {/* Debug info - can be removed in production */}
//           {/* <div className="mt-6 p-3 bg-gray-100 rounded-lg text-left">
//             <details>
//               <summary className="text-xs font-medium text-gray-500 cursor-pointer">
//                 Debug info
//               </summary>
//               <div className="mt-2 text-xs font-mono">
//                 <div>
//                   Listening:{" "}
//                   <span
//                     className={isListening ? "text-green-600" : "text-red-600"}
//                   >
//                     {String(isListening)}
//                   </span>
//                 </div>
//                 <div>
//                   Loading:{" "}
//                   <span
//                     className={isLoading ? "text-green-600" : "text-red-600"}
//                   >
//                     {String(isLoading)}
//                   </span>
//                 </div>
//                 <div>
//                   Playing:{" "}
//                   <span
//                     className={isPlaying ? "text-green-600" : "text-red-600"}
//                   >
//                     {String(isPlaying)}
//                   </span>
//                 </div>
//                 <div>
//                   Speech Detected:{" "}
//                   <span
//                     className={
//                       isSpeechDetected ? "text-green-600" : "text-red-600"
//                     }
//                   >
//                     {String(isSpeechDetected)}
//                   </span>
//                 </div>
//                 <div>
//                   Has transcript:{" "}
//                   <span
//                     className={transcript ? "text-green-600" : "text-red-600"}
//                   >
//                     {String(!!transcript)}
//                   </span>
//                 </div>
//                 <div>
//                   Has response:{" "}
//                   <span
//                     className={response ? "text-green-600" : "text-red-600"}
//                   >
//                     {String(!!response)}
//                   </span>
//                 </div>
//                 <div>
//                   Recognition available:{" "}
//                   <span
//                     className={
//                       recognitionRef.current ? "text-green-600" : "text-red-600"
//                     }
//                   >
//                     {String(!!recognitionRef.current)}
//                   </span>
//                 </div>
//               </div>
//             </details>
//           </div> */}
//         </div>

//         <audio ref={audioRef} className="hidden" controls />
//       </main>

//       {/* <footer className="py-4 text-center text-white/70">
//         <p>Built with Next.js and Tailwind CSS</p>
//       </footer> */}
//     </div>
//   );
// }

// pages/index.js
import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import {
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/solid";
import { speakText } from "../utiles/speechSynthesis";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);

  const handleQuerySubmission = useCallback(
    async (text) => {
      console.log("handleQuerySubmission called with:", text || transcript);
      const queryText = text || transcript;
      if (!queryText.trim()) {
        console.log("Empty query text, returning");
        return;
      }

      console.log("Setting loading state");
      setIsLoading(true);
      try {
        console.log("Would call API with:", queryText);

        const apiResponse = await fetch(
          // "http://192.168.1.10:5000/api/get_audio_text",
          "https://react.hivoco.com/api/get_audio_text",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: queryText }),
          }
        );

        if (!apiResponse.ok) {
          throw new Error("Failed to get response from API");
        }

        const data = await apiResponse.json();
        console.log(data);

        setResponse(data.text);

        // Check if the response has empty audioUrl or text
        if (!data.text || !data.audioUrl) {
          console.log("Empty response data, restarting listening");
          setResponse(data.text || "No response received");
          // If either audioUrl or text is empty, restart listening
          if (recognitionRef.current) {
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
            }, 300);
          }
          return;
        }
        if (data.audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = data.audioUrl;
            setIsPlaying(true);

            try {
              await audioRef.current.play();
            } catch (error) {
              console.error("Audio playback error:", error);
              // Fallback to speech synthesis if audio playback fails
              setIsPlaying(true);
              try {
                await speakText(data.text);
              } catch (synthError) {
                console.error("Speech synthesis error:", synthError);
              } finally {
                setIsPlaying(false);
              }
            }
          }
        } else {
          // Use browser's speech synthesis if no audio URL is provided
          setIsPlaying(true);
          try {
            await speakText(data.text);
          } catch (error) {
            console.error("Speech synthesis error:", error);
          } finally {
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error("Error getting response:", error);
        setResponse("Sorry, there was an error processing your request.");
      } finally {
        setIsLoading(false);
      }
    },
    [transcript]
  );

  const refreshCurrentPage = () => {
    const router = useRouter();
    router.replace(router.asPath);
  };
  // Restart listening when conditions allow
  useEffect(() => {
    if (!isListening && !isLoading && !isPlaying && recognitionRef.current) {
      // If we're not listening, loading, or playing, restart listening
      setTimeout(() => {
        recognitionRef.current.start();
        setIsListening(true);
      }, 300);
    }
  }, [isListening, isLoading, isPlaying]);

  // Configure audio element
  useEffect(() => {
    if (audioRef.current) {
      // Set audio element to stop any current playing and try to play immediately when src changes
      audioRef.current.preload = "auto";
      audioRef.current.oncanplaythrough = () => {
        if (!audioRef.current.paused) return;
        audioRef.current.play().catch((err) => {
          console.error("Audio autoplay failed:", err);
        });
      };
    }
  }, []);

  // Setup speech recognition - do this only once on component mount to avoid recreation
  useEffect(() => {
    // Initialize speech recognition on client side only
    if (
      (typeof window !== "undefined" && "SpeechRecognition" in window) ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      // Set a longer timeout for speech recognition
      // Default is often too short (5 seconds)
      recognitionRef.current.maxAlternatives = 1;

      // These are important for consistency across browsers
      if (typeof recognitionRef.current.lang === "string") {
        recognitionRef.current.lang = "en-US";
      }

      console.log("Speech recognition initialized");
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array = only on mount

  // Handle speech recognition events with access to current state
  useEffect(() => {
    if (!recognitionRef.current) return;

    // Function to clear the speech timeout
    const clearSpeechTimeout = () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    };

    // Define event handlers
    const handleResult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      console.log("Speech detected:", transcriptText);
      setTranscript(transcriptText);
      setIsSpeechDetected(true);

      // Reset the speech timeout whenever we get a result
      clearSpeechTimeout();

      // Set a new timeout - if no new speech is detected in 1.5 seconds,
      // we'll consider the user done speaking
      speechTimeoutRef.current = setTimeout(() => {
        console.log("Speech timeout - user finished speaking");

        // Stop recognition to trigger the onend handler
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 1500); // 1.5 seconds of silence = done speaking
    };

    const handleEnd = () => {
      // Clear any pending speech timeout
      clearSpeechTimeout();

      console.log("Speech recognition ended", {
        isListening,
        isSpeechDetected,
        transcript,
      });

      // Only call the API when speech was detected
      if (isSpeechDetected) {
        console.log("Speech detected, calling API");
        setIsSpeechDetected(false);
        handleQuerySubmission(transcript);
      } else if (isListening && !isLoading && !isPlaying) {
        // Just restart listening if no speech was detected
        console.log("No speech detected, restarting recognition");
        recognitionRef.current.start();
      }
    };

    // Handle speech recognition error
    const handleError = (event) => {
      console.error("Speech recognition error:", event.error);
      // Clear any pending speech timeout
      clearSpeechTimeout();
    };

    // Attach event handlers
    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onend = handleEnd;
    recognitionRef.current.onerror = handleError;

    return () => {
      // Clear any pending speech timeout on cleanup
      clearSpeechTimeout();
    };
  }, [
    isListening,
    isLoading,
    isPlaying,
    isSpeechDetected,
    transcript,
    handleQuerySubmission,
  ]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setResponse("");
      setTranscript("");
      setIsSpeechDetected(false);
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  // Handle when audio playback ends
  useEffect(() => {
    const handleAudioEnded = () => {
      setIsPlaying(false);
      // Resume listening after audio playback
      if (recognitionRef.current) {
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 500);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioEnded);
      }
    };
  }, []);

  // UI Helper to display sound visualization
  const SoundWaves = () => {
    return (
      <div className="flex items-center justify-center gap-1 h-6 mt-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-white rounded-full transform transition-all duration-300 ${
              isListening ? "animate-soundwave" : "h-1"
            }`}
            style={{
              animationDelay: `${i * 0.15}s`,
              height: isListening ? `${12 + Math.random() * 12}px` : "4px",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 via-orange-600 to-red-700">
      <Head>
        <title>Tata Tea Voice Assistant</title>
        <link rel="icon" href="/favicon.ico" />
        <style jsx global>{`
          @keyframes soundwave {
            0%,
            100% {
              height: 4px;
            }
            50% {
              height: 20px;
            }
          }

          .animate-soundwave {
            animation: soundwave 0.5s ease-in-out infinite;
          }

          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }
            80%,
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          .animate-pulse-ring {
            animation: pulse-ring 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
              infinite;
          }

          .chat-bubble {
            position: relative;
          }

          .chat-bubble::after {
            content: "";
            position: absolute;
            bottom: -10px;
            left: 20px;
            border-width: 10px 10px 0;
            border-style: solid;
            border-color: currentColor transparent;
            display: block;
            width: 0;
          }

          .user-bubble::after {
            border-color: #f3f4f6 transparent;
            left: auto;
            right: 20px;
          }

          .assistant-bubble::after {
            border-color: #eff6ff transparent;
          }
        `}</style>
      </Head>

      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Logo and Header */}
        <div className="w-full max-w-md text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            {/* <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mr-3 shadow-lg">
              <Image 
                src="/api/placeholder/32/32" 
                alt="Tata Tea Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div> */}
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Tata Tea Voice Assistant
            </h1>
          </div>
          <p className="text-white/90 text-sm">
            Your wellness companion for tea time
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="w-full max-w-md bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          {/* Top wave design */}
          <div className="h-16 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden">
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                className="fill-white"
              ></path>
            </svg>
          </div>

          <div className="p-6">
            {/* Microphone Button */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                {/* Pulsing background for active state */}
                {isListening && (
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse-ring"></div>
                )}

                <button
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`relative z-10 w-24 h-24 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                    isListening
                      ? "bg-red-500 scale-110"
                      : isLoading
                      ? "bg-amber-500"
                      : isPlaying
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  }`}
                >
                  {isListening ? (
                    <StopIcon className="h-10 w-10 text-white" />
                  ) : isLoading ? (
                    <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isPlaying ? (
                    <SpeakerWaveIcon className="h-10 w-10 text-white" />
                  ) : (
                    <MicrophoneIcon className="h-10 w-10 text-white" />
                  )}
                </button>
              </div>

              {/* Status text */}
              <div className="mt-4 h-6 text-center">
                {isListening ? (
                  <div className="flex flex-col items-center">
                    <p className="text-red-500 font-medium">Listening...</p>
                    <SoundWaves />
                  </div>
                ) : isLoading ? (
                  <p className="text-amber-500 font-medium">Processing...</p>
                ) : isPlaying ? (
                  <p className="text-green-500 font-medium">Speaking...</p>
                ) : (
                  <p className="text-gray-500 text-sm">Tap to speak</p>
                )}
              </div>
            </div>

            {/* Conversation Area */}
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-4">
              {transcript && (
                <div className="chat-bubble user-bubble ml-8 p-4 bg-gray-100 rounded-2xl rounded-tr-none shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-gray-800">{transcript}</p>
                    </div>
                  </div>
                </div>
              )}

              {response && (
                <div className="chat-bubble assistant-bubble mr-8 p-4 bg-blue-50 rounded-2xl rounded-tl-none shadow-sm border-l-4 border-orange-500">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <p className="text-gray-700">{response}</p>
                    </div>
                  </div>
                </div>
              )}

              {!transcript && !response && (
                <div className="text-center py-8 text-gray-400">
                  <p>Ask me about Tata Tea products or wellness tips!</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom design */}
          <div className="h-8 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden">
            <svg
              className="absolute top-0 w-full transform rotate-180"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                className="fill-white"
              ></path>
            </svg>
          </div>
        </div>

        {/* Feature highlights */}
        {/* <div className="w-full max-w-md mt-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <p className="text-white text-xs">Personal Wellness</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-white text-xs">Tea Recommendations</p>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-white text-xs">Health Benefits</p>
            </div>
          </div>
        </div> */}

        <audio ref={audioRef} className="hidden" controls />
      </main>

      <footer className="mt-auto py-4 text-center text-white/70 text-xs">
        <p>© {new Date().getFullYear()} Tata Tea. All rights reserved.</p>
      </footer>
    </div>
  );
}
