
import React, { useState, useEffect, useRef, useCallback } from "react";

// Define icon components directly to avoid import errors
const MicrophoneIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
      clipRule="evenodd"
    />
  </svg>
);

const StopIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
      clipRule="evenodd"
    />
  </svg>
);

const SpeakerWaveIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 3.75a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM14.25 5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5a.75.75 0 01.75-.75zM6.5 6a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 016.5 6z"
      clipRule="evenodd"
    />
  </svg>
);

const PrimeVideoVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);

  // Sample episodes data
  const episodes = [
    {
      id: 1,
      title: "Welcome Back to Phulera",
      duration: "35 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "Sachiv Ji returns to Phulera with new challenges as the village faces unexpected developments.",
    },
    {
      id: 2,
      title: "Pradhan vs MLA",
      duration: "38 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "A political showdown unfolds when the MLA visits Phulera, putting Pradhan Manju Devi in a difficult position.",
    },
    {
      id: 3,
      title: "The Water Crisis",
      duration: "34 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "Phulera faces a severe water shortage, and Abhishek devises an innovative solution.",
    },
    {
      id: 4,
      title: "Election Fever",
      duration: "36 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "As local elections approach, alliances shift and rivalries intensify in the village.",
    },
    {
      id: 5,
      title: "Family Matters",
      duration: "39 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "Prahlad's family issues spill over into village affairs, causing complications for everyone.",
    },
    {
      id: 6,
      title: "The Festival",
      duration: "37 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "The annual village festival brings both celebration and unexpected conflicts.",
    },
    {
      id: 7,
      title: "Urban Development",
      duration: "40 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "A government scheme for rural development brings both opportunity and corruption to Phulera.",
    },
    {
      id: 8,
      title: "Season Finale",
      duration: "45 min",
      thumbnail: "/api/placeholder/320/180",
      description:
        "Major changes come to Phulera as characters face life-altering decisions.",
    },
  ];

  // Cast data
  const cast = [
    {
      name: "Jitendra Kumar",
      role: "Abhishek Tripathi",
      image: "/api/placeholder/150/150",
    },
    {
      name: "Neena Gupta",
      role: "Manju Devi",
      image: "/api/placeholder/150/150",
    },
    {
      name: "Raghubir Yadav",
      role: "Brij Bhushan Dubey",
      image: "/api/placeholder/150/150",
    },
    { name: "Chandan Roy", role: "Vikas", image: "/api/placeholder/150/150" },
    {
      name: "Faisal Malik",
      role: "Prahlad",
      image: "/api/placeholder/150/150",
    },
  ];

  // Handle query submission
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
          "https://sampann-open.thefirstimpression.ai/api/get_audio_text",
          //   "http://192.168.1.10:5000/api/get_audio_text",
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

  // Show animated tap hint on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTapHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
    // Hide the tap hint when button is clicked
    setShowTapHint(false);

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

  // UI Helper function for sound visualization
  const SoundWaves = () => {
    return (
      <div className="flex items-center justify-center gap-1 h-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-white rounded-full transform transition-all duration-300 ${
              isListening ? "animate-soundwave" : "h-1"
            }`}
            style={{
              animationDelay: `${i * 0.15}s`,
              height: isListening ? `${8 + Math.random() * 8}px` : "4px",
            }}
          />
        ))}
      </div>
    );
  };

  // Function to play episode
  const togglePlay = (episode) => {
    setSelectedEpisode(episode);
    // Here you would typically start playback
  };

  // Speech synthesis function
  const speakText = async (text) => {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject("Speech synthesis not supported");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      // Optional: Configure voice, rate, pitch, etc.
      // utterance.voice = speechSynthesis.getVoices()[0];
      utterance.rate = 1;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    });
  };

  // Hand cursor animation component
  const TapAnimation = () => {
    if (!showTapHint) return null;

    return (
      <div
       
        className="absolute -bottom-10 right-1/2 transform translate-x-8 animate-tap-hint bg-[ur]"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M9 11.25c0-.966.784-1.75 1.75-1.75s1.75.784 1.75 1.75v3.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12.5 14.75h2.25c.69 0 1.25.56 1.25 1.25 0 .69-.56 1.25-1.25 1.25h-.75"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 16a3 3 0 0 1 3-3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M11.25 11.25V8.75"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  // Ripple effect component
  const RippleEffect = () => {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 rounded-full animate-ripple"
          style={{ borderColor: isListening ? "#ef4444" : "#2162a1" }}
        ></div>
        <div
          className="absolute inset-0 rounded-full animate-ripple animation-delay-300"
          style={{ borderColor: isListening ? "#ef4444" : "#2162a1" }}
        ></div>
        <div
          className="absolute inset-0 rounded-full animate-ripple animation-delay-600"
          style={{ borderColor: isListening ? "#ef4444" : "#2162a1" }}
        ></div>
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundImage: 'url("/NetaJi.png")',
        backgroundSize: "contain",
        backgroundPosition: "center",
      }}
      className="flex flex-col h-svh bg-black text-white p-3 bg-no-repeat"
    >
      {/* Top Navigation Bar */}
      <nav className=" p-4 flex items-center justify-between ">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold" style={{ color: "#2162a1" }}>
            prime video
          </h1>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-gray-300">
              Home
            </a>
            <a href="#" className="hover:text-gray-300">
              TV Shows
            </a>
            <a href="#" className="hover:text-gray-300">
              Movies
            </a>
            <a href="#" className="hover:text-gray-300">
              Kids
            </a>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <span>A</span>
        </div>
      </nav>

      {/* Voice Assistant Main Area */}
      <div className="h-full flex justify-center items-center flex-col gap-10">
        {/* Beautiful Mic Button with Effects */}
        <div className="flex flex-col items-center relative">
          {/* Glowing background effect */}
          <div
            className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-500 ${
              isListening ? "opacity-60 bg-red-500" : "opacity-40 bg-blue-500"
            }`}
            style={{
              width: "80px",
              height: "80px",
              transform: "translate(-15%, -15%)",
              filter: "blur(15px)",
            }}
          ></div>

          {/* Main button with ripple effect */}
          <div className="relative">
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`relative z-10 w-20 h-20 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 border-2 ${
                isListening
                  ? "bg-red-500 scale-110 border-red-400"
                  : isLoading
                  ? "bg-amber-500 border-amber-400"
                  : isPlaying
                  ? "bg-green-500 border-green-400"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-blue-500"
              }`}
              style={{
                boxShadow: isListening
                  ? "0 0 20px rgba(239, 68, 68, 0.7)"
                  : isLoading
                  ? "0 0 20px rgba(245, 158, 11, 0.7)"
                  : isPlaying
                  ? "0 0 20px rgba(16, 185, 129, 0.7)"
                  : "0 0 20px rgba(33, 98, 161, 0.3)",
              }}
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

              {isListening && (
                <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-75"></span>
              )}

              {/* Ripple animation */}
              {!isLoading && !isPlaying && <RippleEffect />}
            </button>

            {/* Tap animation */}
            <TapAnimation />
          </div>

          {/* Text label with dynamic styling */}
          <div
            className={`mt-4 text-center transition-all duration-300 ${
              isListening
                ? "text-red-400"
                : isLoading
                ? "text-amber-400"
                : isPlaying
                ? "text-green-400"
                : "text-gray-400"
            }`}
          >
            <p className="font-medium text-sm text-black mb-1">
              {isListening
                ? "Listening..."
                : isLoading
                ? "Processing..."
                : isPlaying
                ? "Speaking..."
                : "Tap to Speak"}
            </p>

            {/* Sound visualization */}
            {isListening && (
              <div className="flex justify-center mt-1">
                <SoundWaves />
              </div>
            )}

            {/* Helpful hint */}
            {!isListening &&
              !isLoading &&
              !isPlaying &&
              !transcript &&
              !response && (
                <p className="text-xs text-blue-600 mt-1 opacity-70">
                  Ask me about my plans for Phulera.
                </p>
              )}
          </div>
        </div>

        {/* Voice Assistant Response Area - Only visible when there's activity */}
        {(transcript || response) && (
          <div className="bg-gray-900 bg-opacity-90 p-6 max-w-5xl rounded-xl border border-gray-800 shadow-2xl">
            <div className="max-w-3xl mx-auto">
              {/* Conversation header */}
              <div className="flex items-center mb-4 pb-2 border-b border-gray-800">
                <div
                  className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mr-3"
                  style={{ backgroundColor: "#2162a1" }}
                >
                  <SpeakerWaveIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Prime Assistant</h3>
                  <p className="text-xs text-gray-400">
                    Powered by Prime Video
                  </p>
                </div>
              </div>

              {/* Conversation content */}
              <div className="space-y-4">
                {transcript && (
                  <div className="p-4 bg-gray-800 rounded-lg text-gray-200 text-sm animate-fadeIn">
                    <div className="flex">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0 mr-3 flex items-center justify-center">
                        <span className="text-xs">Y</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">You</p>
                        <p>{transcript}</p>
                      </div>
                    </div>
                  </div>
                )}

                {response && (
                  <div
                    className="p-4 rounded-lg text-blue-50 text-sm animate-fadeIn"
                    style={{
                      backgroundColor: "rgba(30, 58, 138, 0.4)",
                      borderLeft: "3px solid #2162a1",
                    }}
                  >
                    <div className="flex">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 mr-3 flex items-center justify-center"
                        style={{ backgroundColor: "#2162a1" }}
                      >
                        <span className="text-xs">P</span>
                      </div>
                      <div>
                        <p className="text-xs text-blue-300 mb-1">
                          Prime Assistant
                        </p>
                        <p>{response}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" controls />

      {/* CSS for animations */}
      <style jsx>{`
        /* Sound wave animation */
        @keyframes soundwave {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 16px;
          }
        }

        .animate-soundwave {
          animation: soundwave 0.5s ease-in-out infinite;
        }

        /* Pulse ring animation */
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
          animation: pulse-ring 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        /* Ripple effect */
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
            border: 1px solid currentColor;
          }
          100% {
            transform: scale(2);
            opacity: 0;
            border: 1px solid currentColor;
          }
        }

        .animate-ripple {
          animation: ripple 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        /* Tap hand animation */
        @keyframes tap-hint {
          0% {
            transform: translate(0, -10px);
            opacity: 0;
          }
          20% {
            transform: translate(0, 0);
            opacity: 1;
          }
          60% {
            transform: translate(0, 0);
            opacity: 1;
          }
          90% {
            transform: translate(0, -5px) scale(0.9);
            opacity: 0.3;
          }
          100% {
            transform: translate(0, -10px) scale(0.8);
            opacity: 0;
          }
        }

        .animate-tap-hint {
          animation: tap-hint 2s ease-in-out infinite;
        }

        /* Fade in animation */
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PrimeVideoVoiceAssistant;
