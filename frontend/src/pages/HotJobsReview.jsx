import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMicrophone, FaVolumeUp, FaPhone, FaArrowLeft, FaArrowRight, FaSave, FaExclamationTriangle } from 'react-icons/fa';

const JOB_OPTIONS = [
  "HVAC Repair", "Accountant", "Airport (Baggage/customer service/ground ops)",
  "Auto Parts", "Car Wash Attendant", "Cashier", "Catering", "CDL Driver",
  "Cement Mason/finisher", "Computer / IT", "Computer Programmer", "Construction",
  "Corrections", "Custodian", "Customer service", "Data Entry", "Day Care / Preschool",
  "Delivery Driver", "Drywaller", "Educator", "Electrician", "Engineering",
  "Event Staff", "Fast food", "Gas Station Attendant", "Grocery Store",
  "Healthcare", "Hotel/Hospitality", "Housekeeper", "Information Technology (IT)",
  "Landscaping", "Manager (Department/Project)", "Manager (Store/Crew)", "Mechanic",
  "Manufacturing", "Nursing", "Painter", "Pest Control", "Plumbing",
  "Restaurant (Cook/Waiter/Host)", "Retail", "Sales", "Security", "Stocking",
  "Telephone/Call Center/Scheduling", "Theme Park", "Trucking/Transportation",
  "Warehousing/Logistics", "Other"
];

function HotJobsReview({ user }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [categorySelected, setCategorySelected] = useState(false);
  const [jobTypeQuery, setJobTypeQuery] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [reviewTitle, setReviewTitle] = useState('Hot Jobs Review');


  // Accessibility and Voice Assistant States
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [isListeningForJobs, setIsListeningForJobs] = useState(false);
  const [isListeningForCompanyType, setIsListeningForCompanyType] = useState(false);
  const [isListeningForNotes, setIsListeningForNotes] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [isListeningForHiring, setIsListeningForHiring] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);
  const recognitionRef = useRef(null);
  const spokenJobsAccumulatorRef = useRef('');
  const currentSessionTranscriptRef = useRef('');
  const [speechStatus, setSpeechStatus] = useState('Voice Controls Offline');

  const [micVolume, setMicVolume] = useState(0);
  const [speechTrigger, setSpeechTrigger] = useState(0);
  const isSpeakingTTSRef = useRef(false);
  const activeUtteranceRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);

  const formRef = useRef(null);

  // Refs to prevent stale state captures in speech callbacks
  const voiceActiveRef = useRef(voiceActive);
  const isListeningForJobsRef = useRef(isListeningForJobs);
  const isListeningForCompanyTypeRef = useRef(isListeningForCompanyType);
  const isListeningForNotesRef = useRef(isListeningForNotes);
  const isVoicePausedRef = useRef(isVoicePaused);
  const isListeningForHiringRef = useRef(isListeningForHiring);
  const jobsRef = useRef(jobs);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
    isListeningForJobsRef.current = isListeningForJobs;
    isListeningForCompanyTypeRef.current = isListeningForCompanyType;
    isListeningForNotesRef.current = isListeningForNotes;
    isVoicePausedRef.current = isVoicePaused;
    isListeningForHiringRef.current = isListeningForHiring;
    jobsRef.current = jobs;
    currentIndexRef.current = currentIndex;
  }, [voiceActive, isListeningForJobs, isListeningForCompanyType, isListeningForNotes, isVoicePaused, isListeningForHiring, jobs, currentIndex]);

  // Audio chirp feedback for voice controls
  const playChirp = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.26);
      } else if (type === 'listen') {
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.stop(ctx.currentTime + 0.09);
      }
    } catch (e) {
      console.error("Audio cue error:", e);
    }
  };

  // Text-To-Speech (TTS) voice synthesis with Speech Recognition coordination
  const speak = (text, onEndCallback = null, rate = 0.95) => {
    if ('speechSynthesis' in window) {
      console.log(`[Voice Assistant] TTS Speaking: "${text}"`);

      // 1. Abort current speech recognition immediately if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn("[Voice Assistant] Failed to abort recognition during speak:", e);
        }
      }

      // 2. Set speaking state
      isSpeakingTTSRef.current = true;
      setSpeechStatus('System speaking...');

      // Cancel any ongoing synthesis
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // use custom rate if provided
      activeUtteranceRef.current = utterance;

      const handleSpeechEnd = () => {
        if (activeUtteranceRef.current === utterance) {
          console.log("[Voice Assistant] TTS Speaking finished.");
          isSpeakingTTSRef.current = false;
          activeUtteranceRef.current = null;
          if (onEndCallback) {
            onEndCallback();
          }
          // Restart Speech Recognition
          setSpeechTrigger(prev => prev + 1);
        }
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = (event) => {
        console.warn("[Voice Assistant] TTS speaking error or cancelled:", event);
        handleSpeechEnd();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const speakJobDetails = (job) => {
    if (!job) return;
    const available = job.available_jobs ? job.available_jobs : "No specific jobs listed";
    const contactPhoneFormatted = job.contact_phone ? job.contact_phone.split('').join(' ') : "not listed";
    const companyType = (job.company_type && job.company_type.trim()) ? job.company_type : "Nothing entered";
    const currentlyHiring = (job.currently_hiring === 'TRUE' || job.currently_hiring === 'Yes' || job.currently_hiring === true || String(job.currently_hiring).toUpperCase() === 'TRUE') ? 'Yes' : 'No';
    const notesText = `. Additional Notes: ${(job.notes && job.notes.trim()) ? job.notes : "None"}`;
    const text = `Company: ${job.company_name || 'unknown'}. Company Type: ${companyType}. Currently Hiring: ${currentlyHiring}. Available Jobs: ${available}. Contact Phone: ${contactPhoneFormatted}${notesText}.`;
    speak(text);
  };

  // Telephone call handler
  const handleCallCompany = () => {
    const job = jobsRef.current[currentIndexRef.current];
    if (job && job.contact_phone && job.contact_phone.trim()) {
      const phoneNumber = job.contact_phone.trim();
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      const spokenDigits = cleanDigits.split('').join(', ');
      speak(`Here is the phone number to call.`, () => {
        speak(spokenDigits, null, 0.6);
      });
    } else {
      playChirp('error');
      speak("There is no phone number listed for this job.");
    }
  };

  // Fuzzy matching for multiple spoken job types
  const processSpokenJobTypes = (transcript) => {
    const cleanTranscript = transcript.toLowerCase().replace(/[^a-z0-9/]/g, ' ');
    const words = cleanTranscript.split(/\s+/).filter(Boolean);
    const matchedIndices = new Set();
    const matchedOptions = [];

    const optionKeywords = {
      "HVAC Repair": ["hvac repair", "hvac", "a/c repair", "a/c", "ac repair", "ac", "air conditioning"],
      "Accountant": ["accountant", "accounting"],
      "Airport (Baggage/customer service/ground ops)": ["airport", "baggage", "ground ops", "customer service"],
      "Auto Parts": ["auto parts", "car parts"],
      "Car Wash Attendant": ["car wash", "carwash"],
      "Cashier": ["cashier", "register"],
      "Catering": ["catering", "caterer"],
      "CDL Driver": ["cdl driver", "cdl", "driving", "driver"],
      "Cement Mason/finisher": ["cement mason", "cement finisher", "cement"],
      "Computer / IT": ["computer / it", "computer", "it support", "tech support", "computer support", "it"],
      "Computer Programmer": ["computer programmer", "programmer", "programming", "developer", "coding", "coder"],
      "Construction": ["construction", "builder", "building"],
      "Corrections": ["corrections", "correctional officer"],
      "Custodian": ["custodian", "janitor", "janitorial", "cleaning", "cleaner"],
      "Customer service": ["customer service", "help desk"],
      "Data Entry": ["data entry", "typing"],
      "Day Care / Preschool": ["day care", "preschool", "childcare"],
      "Delivery Driver": ["delivery driver", "delivery"],
      "Drywaller": ["drywaller", "drywall"],
      "Educator": ["educator", "teacher", "teaching", "education"],
      "Electrician": ["electrician", "electrical"],
      "Engineering": ["engineering", "engineer"],
      "Event Staff": ["event staff", "events"],
      "Fast food": ["fast food", "burger"],
      "Gas Station Attendant": ["gas station", "gas station attendant"],
      "Grocery Store": ["grocery store", "grocery", "supermarket"],
      "Healthcare": ["healthcare", "health care", "medical"],
      "Hotel/Hospitality": ["hotel", "hospitality", "motel"],
      "Housekeeper": ["housekeeper", "housekeeping"],
      "Information Technology (IT)": ["information technology", "it support", "tech support", "computer support", "it"],
      "Landscaping": ["landscaping", "landscaper", "lawn care", "gardener"],
      "Manager (Department/Project)": ["manager department", "project manager"],
      "Manager (Store/Crew)": ["manager store", "crew manager", "store manager"],
      "Mechanic": ["mechanic", "automotive technician"],
      "Manufacturing": ["manufacturing", "factory"],
      "Nursing": ["nursing", "nurse", "cna", "lpn", "rn"],
      "Painter": ["painter", "painting"],
      "Pest Control": ["pest control", "exterminator"],
      "Plumbing": ["plumbing", "plumber"],
      "Restaurant (Cook/Waiter/Host)": ["restaurant", "cook", "waiter", "waitress", "host", "hostess", "server", "bartender", "chef"],
      "Retail": ["retail", "sales associate"],
      "Sales": ["sales", "telesales"],
      "Security": ["security", "security guard", "bouncer"],
      "Stocking": ["stocking", "stocker"],
      "Telephone/Call Center/Scheduling": ["telephone", "call center", "scheduling", "telemarketing", "telemarketer"],
      "Theme Park": ["theme park", "amusement park"],
      "Trucking/Transportation": ["trucking", "transportation", "truck driver", "truck"],
      "Warehousing/Logistics": ["warehousing", "logistics", "warehouse"],
      "Other": ["other"]
    };

    for (const [option, keywords] of Object.entries(optionKeywords)) {
      const sortedKeywords = [...keywords].sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length);

      for (const kw of sortedKeywords) {
        const kwWords = kw.toLowerCase().split(/\s+/).filter(Boolean);
        let found = false;
        for (let i = 0; i <= words.length - kwWords.length; i++) {
          let match = true;
          const indicesToCheck = [];
          for (let j = 0; j < kwWords.length; j++) {
            const idx = i + j;
            if (words[idx] !== kwWords[j] || matchedIndices.has(idx)) {
              match = false;
              break;
            }
            indicesToCheck.push(idx);
          }
          if (match) {
            indicesToCheck.forEach(idx => matchedIndices.add(idx));
            if (!matchedOptions.includes(option)) {
              matchedOptions.push(option);
            }
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
    }

    const stopWords = new Set(["and", "or", "for", "the", "a", "an", "hiring", "job", "jobs", "types", "type", "update", "new", "with", "current", "site"]);
    const unmatchedParts = [];
    let currentUnmatched = [];

    for (let i = 0; i < words.length; i++) {
      if (matchedIndices.has(i)) {
        if (currentUnmatched.length > 0) {
          unmatchedParts.push(currentUnmatched.join(' '));
          currentUnmatched = [];
        }
      } else {
        if (!stopWords.has(words[i])) {
          currentUnmatched.push(words[i]);
        } else {
          if (currentUnmatched.length > 0) {
            unmatchedParts.push(currentUnmatched.join(' '));
            currentUnmatched = [];
          }
        }
      }
    }
    if (currentUnmatched.length > 0) {
      unmatchedParts.push(currentUnmatched.join(' '));
    }

    const cleanUnmatched = unmatchedParts.filter(Boolean);
    const allJobs = [...matchedOptions];
    const available_jobs_str = allJobs.join(', ') + (cleanUnmatched.length > 0 ? (allJobs.length > 0 ? ', ' : '') + cleanUnmatched.join(', ') : '');

    const updatedJobs = [...jobsRef.current];
    updatedJobs[currentIndexRef.current] = {
      ...updatedJobs[currentIndexRef.current],
      available_jobs: available_jobs_str
    };
    setJobs(updatedJobs);
    setUpdateKey(prev => prev + 1);

    playChirp('success');
    speak(`Updated job types to: ${available_jobs_str || 'none'}. You can say "save" to submit, or "update job types" to try again.`);
  };

  // Fuzzy matching for spoken company type
  const processSpokenCompanyType = (transcript) => {
    const cleanTranscript = transcript.toLowerCase().trim();
    const companyTypes = [
      "Construction", "Driving", "Education", "Government related", "Healthcare",
      "Hospitality", "Janitorial", "Non-Profit", "Restaurant", "Retail",
      "Technology", "Theme Park", "Call Center", "Fast Food", "Services",
      "Vocation careers (HVAC, plumbing, electrical, etc)"
    ];

    const companyTypeKeywords = {
      "Construction": ["construction", "building"],
      "Driving": ["driving", "driver", "transportation"],
      "Education": ["education", "school", "teaching", "university", "college"],
      "Government related": ["government related", "government", "city", "state", "federal", "county"],
      "Healthcare": ["healthcare", "health care", "medical", "hospital", "clinic", "nursing"],
      "Hospitality": ["hospitality", "hotel", "motel", "resort"],
      "Janitorial": ["janitorial", "cleaning", "custodian", "janitor"],
      "Non-Profit": ["non-profit", "non profit", "charity"],
      "Restaurant": ["restaurant", "food service", "dining", "bar"],
      "Retail": ["retail", "store", "shop", "sales"],
      "Technology": ["technology", "tech", "software", "it", "computers"],
      "Theme Park": ["theme park", "amusement park"],
      "Call Center": ["call center", "telemarketing", "customer service"],
      "Fast Food": ["fast food", "burger", "drive thru", "drive-thru"],
      "Services": ["services", "maintenance", "repair", "service"],
      "Vocation careers (HVAC, plumbing, electrical, etc)": ["vocation", "vocational", "hvac", "plumbing", "electrical", "careers"]
    };

    let matchedType = "";

    for (const type of companyTypes) {
      if (cleanTranscript.includes(type.toLowerCase())) {
        matchedType = type;
        break;
      }
    }

    if (!matchedType) {
      for (const [type, keywords] of Object.entries(companyTypeKeywords)) {
        for (const kw of keywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(cleanTranscript)) {
            matchedType = type;
            break;
          }
        }
        if (matchedType) break;
      }
    }

    const finalType = matchedType || transcript.split(/\s+/).map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : '').join(' ');

    const updatedJobs = [...jobsRef.current];
    updatedJobs[currentIndexRef.current] = {
      ...updatedJobs[currentIndexRef.current],
      company_type: finalType
    };
    setJobs(updatedJobs);
    setUpdateKey(prev => prev + 1);
    playChirp('success');
    speak(`Updated company type to: ${finalType}. You can say "save" to submit, or "update company type" to try again.`);
  };

  // Processing dictated notes
  const processSpokenNotes = (transcript) => {
    const updatedJobs = [...jobsRef.current];
    updatedJobs[currentIndexRef.current] = {
      ...updatedJobs[currentIndexRef.current],
      notes: transcript
    };
    setJobs(updatedJobs);
    setUpdateKey(prev => prev + 1);
    playChirp('success');
    speak(`Updated additional notes to: ${transcript}. You can say "save" to submit, or "update notes" to try again.`);
  };

  const handlePauseVoice = () => {
    setIsVoicePaused(true);
    isVoicePausedRef.current = true;
    setIsListeningForJobs(false);
    setIsListeningForCompanyType(false);
    setIsListeningForNotes(false);
    setIsListeningForHiring(false);
    setSpeechStatus('Voice Assistant Paused (Say "Resume" to activate)');
    speak("Voice assistant paused.");
  };

  const handleResumeVoice = () => {
    setIsVoicePaused(false);
    isVoicePausedRef.current = false;
    setSpeechStatus('Listening for Commands...');
    playChirp('success');
    speak("Voice assistant resumed.");
  };

  const updateHiringStatusState = (status) => {
    const updatedJobs = [...jobsRef.current];
    updatedJobs[currentIndexRef.current] = {
      ...updatedJobs[currentIndexRef.current],
      currently_hiring: status
    };
    setJobs(updatedJobs);
    setUpdateKey(prev => prev + 1);
    playChirp('success');
    speak(`Updated currently hiring status to: ${status}. You can say "save" to submit, or "update currently hiring status" to try again.`);
  };

  const fetchJobs = (category, type = '') => {
    setLoading(true);
    setCategorySelected(true);

    if (category === '5days') setReviewTitle('Review Jobs Expiring Soon (5 days)');
    else if (category === '46weeks') setReviewTitle('Review Expired Jobs (4-6 weeks)');
    else if (category === 'type') setReviewTitle(`Review Jobs by Type: ${type}`);
    else if (category === 'unverified_no_career') setReviewTitle('Phone Verification Queue');

    fetch(`/api/hot-jobs-review?category=${category}&type=${encodeURIComponent(type)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJobs(data.jobs);
        } else {
          setMessage(data.error || 'Failed to fetch jobs.');
        }
        setLoading(false);
      })
      .catch(err => {
        setMessage('Error connecting to server.');
        setLoading(false);
      });
  };

  const currentJob = jobs[currentIndex];

  const handleNext = () => {
    if (currentIndexRef.current < jobsRef.current.length - 1) {
      const nextIdx = currentIndexRef.current + 1;
      setCurrentIndex(nextIdx);
      setMessage('');
      setIsListeningForJobs(false);
      setIsListeningForCompanyType(false);
      setIsListeningForNotes(false);
      spokenJobsAccumulatorRef.current = '';
      currentSessionTranscriptRef.current = '';
      if (voiceActiveRef.current) {
        speak(`Job ${nextIdx + 1}.`, () => {
          speakJobDetails(jobsRef.current[nextIdx]);
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentIndexRef.current > 0) {
      const prevIdx = currentIndexRef.current - 1;
      setCurrentIndex(prevIdx);
      setMessage('');
      setIsListeningForJobs(false);
      setIsListeningForCompanyType(false);
      setIsListeningForNotes(false);
      spokenJobsAccumulatorRef.current = '';
      currentSessionTranscriptRef.current = '';
      if (voiceActiveRef.current) {
        speak(`Job ${prevIdx + 1}.`, () => {
          speakJobDetails(jobsRef.current[prevIdx]);
        });
      }
    }
  };

  const handleGoBack = () => {
    setCategorySelected(false);
    setJobs([]);
    // Stop voice and synthesis when exiting reviews
    if (voiceActive) {
      setVoiceActive(false);
      voiceActiveRef.current = false;
      setIsListeningForJobs(false);
      setIsListeningForCompanyType(false);
      setIsListeningForNotes(false);
      spokenJobsAccumulatorRef.current = '';
      currentSessionTranscriptRef.current = '';
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
    }
    window.speechSynthesis.cancel();
    navigate('/hot-jobs-review', { replace: true });
  };

  // URL queries parser on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const type = params.get('type') || '';
    if (category) {
      fetchJobs(category, type);
    }
  }, []);

  // Web Audio API Microphone Volume Level Diagnostics
  useEffect(() => {
    let animationFrameId = null;
    let analyser = null;
    let dataArray = null;
    let source = null;

    if (!voiceActive) {
      setMicVolume(0);
      return;
    }

    const initAudioAnalyser = async () => {
      try {
        console.log("[Voice Assistant] Requesting microphone access for volume level diagnostics...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale it so that standard speech shows a visible response (average / 60)
          const level = Math.min(100, Math.round((average / 60) * 100));
          setMicVolume(level);

          animationFrameId = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error("[Voice Assistant] Failed to initialize microphone volume diagnostics:", err);
        setMicVolume(0);
      }
    };

    initAudioAnalyser();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) { }
        });
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (e) { }
        }
        audioContextRef.current = null;
      }
      setMicVolume(0);
    };
  }, [voiceActive]);

  // Web Speech recognition effect
  useEffect(() => {
    if (!voiceActive) {
      setSpeechStatus('Voice Controls Offline');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus('Speech Recognition Not Supported');
      return;
    }

    // Modern browsers block speech recognition on non-secure origins (HTTP) except localhost/127.0.0.1
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setSpeechStatus('Security Error: Voice requires HTTPS or localhost');
      speak("Security Error. Voice controls require HTTPS or localhost. Microphone access was blocked by your browser.");
      setVoiceActive(false);
      voiceActiveRef.current = false;
      return;
    }

    let active = true;
    let rec = null;

    const startListening = () => {
      if (!active) return;

      // If TTS is currently speaking, defer recognition start
      if (isSpeakingTTSRef.current) {
        console.log("[Voice Assistant] Speech Recognition start deferred (TTS is active).");
        setSpeechStatus('System speaking...');
        return;
      }

      console.log("[Voice Assistant] Starting a new speech recognition session...");
      try {
        rec = new SpeechRecognition();
        rec.continuous = isListeningForJobsRef.current;
        rec.interimResults = false;
        rec.lang = 'en-US';
        recognitionRef.current = rec;

        rec.onstart = () => {
          if (!active) return;
          console.log("[Voice Assistant] Speech recognition started.");
          let statusText = 'Listening for Commands...';
          if (isVoicePausedRef.current) {
            statusText = 'Voice Assistant Paused (Say "Resume" to activate)';
          } else if (isListeningForJobsRef.current) {
            statusText = 'Listening for Job Types (Say Done when finished)...';
          } else if (isListeningForCompanyTypeRef.current) {
            statusText = 'Listening for Company Type...';
          } else if (isListeningForNotesRef.current) {
            statusText = 'Listening for Notes...';
          } else if (isListeningForHiringRef.current) {
            statusText = 'Listening for Currently Hiring Status (Say Yes or No)...';
          }
          setSpeechStatus(statusText);
        };

        rec.onspeechstart = () => {
          if (!active) return;
          console.log("[Voice Assistant] Speech detected by microphone.");
          setSpeechStatus('Speech detected...');
        };

        rec.onspeechend = () => {
          if (!active) return;
          console.log("[Voice Assistant] Speech ended. Processing audio...");
          setSpeechStatus('Processing speech...');
        };

        rec.onresult = (event) => {
          if (!active) return;
          console.log("[Voice Assistant] Speech recognition result received.");
          if (!event.results || event.results.length === 0) return;

          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          console.log("[Voice Assistant] Transcript:", transcript);
          setLastHeard(transcript);

          const transcriptLower = transcript.toLowerCase();

          if (isVoicePausedRef.current) {
            if (transcriptLower.includes("resume") || transcriptLower.includes("start listening")) {
              handleResumeVoice();
            }
            return;
          }

          if (transcriptLower.includes("pause voice assistant") || transcriptLower.includes("pause voice") || transcriptLower === "pause" || transcriptLower.includes("stop listening")) {
            handlePauseVoice();
            if (rec) {
              try { rec.stop(); } catch (e) { }
            }
            return;
          }

          playChirp('listen');

          if (isListeningForJobsRef.current) {
            let currentTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                currentTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript + ' ';
              }
            }
            currentTranscript = currentTranscript.trim();
            currentSessionTranscriptRef.current = currentTranscript;

            const fullTranscript = (spokenJobsAccumulatorRef.current + ' ' + currentTranscript + ' ' + interimTranscript).trim().replace(/\s+/g, ' ');
            console.log("[Voice Assistant] Spoken job types so far (including interim):", fullTranscript);
            setLastHeard(fullTranscript);

            const fullTranscriptLower = fullTranscript.toLowerCase();

            if (fullTranscriptLower.includes("cancel")) {
              setIsListeningForJobs(false);
              spokenJobsAccumulatorRef.current = '';
              currentSessionTranscriptRef.current = '';
              speak("Cancelled updating job types.");
              if (rec) {
                try { rec.stop(); } catch (e) { }
              }
              return;
            }

            if (fullTranscriptLower.includes("pause")) {
              handlePauseVoice();
              if (rec) {
                try { rec.stop(); } catch (e) { }
              }
              return;
            }

            const stopWords = ["done", "finish", "finished", "complete", "completed", "stop"];
            let foundStop = false;
            let stopWordUsed = "";
            for (const word of stopWords) {
              const regex = new RegExp(`\\b${word}\\b`, 'i');
              if (regex.test(fullTranscriptLower)) {
                foundStop = true;
                stopWordUsed = word;
                break;
              }
            }

            if (foundStop) {
              const index = fullTranscriptLower.indexOf(stopWordUsed);
              const cleanText = fullTranscript.substring(0, index).trim();

              setIsListeningForJobs(false);
              spokenJobsAccumulatorRef.current = '';
              currentSessionTranscriptRef.current = '';

              processSpokenJobTypes(cleanText);
              if (rec) {
                try { rec.stop(); } catch (e) { }
              }
            }
            return;
          }

          if (isListeningForCompanyTypeRef.current) {
            if (transcriptLower.includes("pause")) {
              handlePauseVoice();
              return;
            }
            processSpokenCompanyType(transcript);
            setIsListeningForCompanyType(false);
            return;
          }

          if (isListeningForNotesRef.current) {
            if (transcriptLower.includes("pause")) {
              handlePauseVoice();
              return;
            }
            processSpokenNotes(transcript);
            setIsListeningForNotes(false);
            return;
          }

          if (isListeningForHiringRef.current) {
            if (transcriptLower.includes("pause")) {
              handlePauseVoice();
              return;
            }
            const cleanTranscript = transcriptLower.trim();
            if (cleanTranscript.includes("yes") || cleanTranscript === "s") {
              updateHiringStatusState("Yes");
              setIsListeningForHiring(false);
            } else if (cleanTranscript.includes("no")) {
              updateHiringStatusState("No");
              setIsListeningForHiring(false);
            } else {
              playChirp('error');
              speak("I didn't catch that. Please say Yes or No.");
            }
            return;
          }

          if (transcriptLower.includes("next job") || transcriptLower === "next") {
            handleNext();
          } else if (transcriptLower.includes("previous job") || transcriptLower === "previous" || transcriptLower === "back" || transcriptLower === "go back") {
            handlePrev();
          } else if (transcriptLower.includes("read details") || transcriptLower === "read" || transcriptLower === "speak" || transcriptLower === "read job") {
            speakJobDetails(jobsRef.current[currentIndexRef.current]);
          } else if (transcriptLower.includes("call company") || transcriptLower === "call" || transcriptLower === "dial") {
            handleCallCompany();
          } else if (transcriptLower.includes("update company type") || transcriptLower.includes("change company type") || transcriptLower.includes("edit company type")) {
            setIsListeningForCompanyType(true);
            speak("Please say the company type now.");
          } else if (transcriptLower.includes("update job types") || transcriptLower.includes("update jobs") || transcriptLower.includes("edit jobs")) {
            setIsListeningForJobs(true);
            spokenJobsAccumulatorRef.current = '';
            currentSessionTranscriptRef.current = '';
            speak("Please say the hiring job types now. Say 'done' or 'finish' when you are finished listing them.");
          } else if (transcriptLower.includes("update additional notes") || transcriptLower.includes("update notes") || transcriptLower.includes("change notes") || transcriptLower.includes("edit notes") || transcriptLower.includes("add notes")) {
            setIsListeningForNotes(true);
            speak("Please say the additional notes now.");
          } else if (transcriptLower.includes("update currently hiring status") || transcriptLower.includes("update hiring status") || transcriptLower.includes("change currently hiring status") || transcriptLower.includes("change hiring status") || transcriptLower.includes("edit currently hiring status") || transcriptLower.includes("edit hiring status") || transcriptLower.includes("update hiring")) {
            setIsListeningForHiring(true);
            speak("Please say Yes or No for currently hiring status.");
          } else if (transcriptLower.includes("currently hiring yes") || transcriptLower.includes("hiring status yes") || transcriptLower.includes("update currently hiring to yes") || transcriptLower.includes("set currently hiring to yes")) {
            updateHiringStatusState("Yes");
          } else if (transcriptLower.includes("currently hiring no") || transcriptLower.includes("hiring status no") || transcriptLower.includes("update currently hiring to no") || transcriptLower.includes("set currently hiring to no")) {
            updateHiringStatusState("No");
          } else if (transcriptLower.includes("save") || transcriptLower.includes("submit") || transcriptLower.includes("update job")) {
            if (formRef.current) {
              speak("Saving job details.");
              formRef.current.requestSubmit();
            }
          } else if (transcriptLower.includes("help")) {
            speak("Voice commands are: next job, previous job, read details, update company type, update job types, update currently hiring status, update notes, call company, pause, save, or help.");
          }
        };

        rec.onerror = (e) => {
          if (!active) return;
          console.error("[Voice Assistant] Speech Recognition Error:", e.error, e);

          if (e.error === 'not-allowed') {
            setVoiceActive(false);
            voiceActiveRef.current = false;
            setSpeechStatus('Permission Denied. Microphone blocked.');
            playChirp('error');
            speak("Microphone permission was denied. Voice controls disabled.");
          } else if (e.error === 'network') {
            setSpeechStatus('Network Error. Google Speech API offline.');
            playChirp('error');
          } else if (e.error === 'audio-capture') {
            setSpeechStatus('Audio Capture Error. Microphone in use.');
            playChirp('error');
          } else if (e.error === 'no-speech') {
            let statusText = 'Listening for Commands...';
            if (isVoicePausedRef.current) {
              statusText = 'Voice Assistant Paused (Say "Resume" to activate)';
            } else if (isListeningForJobsRef.current) {
              statusText = 'Listening for Job Types (Say Done when finished)...';
            } else if (isListeningForCompanyTypeRef.current) {
              statusText = 'Listening for Company Type...';
            } else if (isListeningForNotesRef.current) {
              statusText = 'Listening for Notes...';
            } else if (isListeningForHiringRef.current) {
              statusText = 'Listening for Currently Hiring Status (Say Yes or No)...';
            }
            setSpeechStatus(statusText);
          } else {
            setSpeechStatus(`Speech Error: ${e.error}`);
          }
        };

        rec.onend = () => {
          console.log("[Voice Assistant] Speech recognition session ended.");
          if (!active) return;

          // If we were listing jobs and the session ended naturally without the keyword,
          // save the accumulated text so far.
          if (isListeningForJobsRef.current) {
            spokenJobsAccumulatorRef.current = (spokenJobsAccumulatorRef.current + ' ' + currentSessionTranscriptRef.current).trim();
            currentSessionTranscriptRef.current = '';
          }

          // Restart after a short delay if still active
          setTimeout(() => {
            if (active && voiceActiveRef.current) {
              startListening();
            } else {
              setSpeechStatus('Voice Controls Offline');
            }
          }, 300);
        };

        rec.start();
      } catch (err) {
        console.error("[Voice Assistant] Speech initialization exception:", err);
        setSpeechStatus('Error starting microphone');
      }
    };

    startListening();

    return () => {
      console.log("[Voice Assistant] Cleaning up speech recognition session...");
      active = false;
      if (rec) {
        try {
          rec.stop();
        } catch (e) {
          // ignore
        }
      }
      recognitionRef.current = null;
    };
  }, [voiceActive, speechTrigger]);

  const toggleVoiceActive = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (voiceActive) {
      setVoiceActive(false);
      voiceActiveRef.current = false;
      setIsVoicePaused(false);
      isVoicePausedRef.current = false;
      setIsListeningForJobs(false);
      setIsListeningForCompanyType(false);
      setIsListeningForNotes(false);
      setIsListeningForHiring(false);
      isListeningForHiringRef.current = false;
      spokenJobsAccumulatorRef.current = '';
      currentSessionTranscriptRef.current = '';
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
      window.speechSynthesis.cancel();
      playChirp('error');
      setSpeechStatus('Voice Controls Offline');
    } else {
      setVoiceActive(true);
      voiceActiveRef.current = true;
      setIsVoicePaused(false);
      isVoicePausedRef.current = false;
      setIsListeningForHiring(false);
      isListeningForHiringRef.current = false;
      playChirp('success');
      setSpeechStatus('Initializing...');
      speak("Voice assistant activated. You can navigate, edit job types, or call the company using voice commands.", () => {
        if (jobsRef.current.length > 0) {
          speakJobDetails(jobsRef.current[currentIndexRef.current]);
        }
      });
    }
  };

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (jobsRef.current.length > 0) {
          speakJobDetails(jobsRef.current[currentIndexRef.current]);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCallCompany();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleVoiceActive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [voiceActive]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.row_index = currentJob.row_index;

    let careerWebsite = data.career_website ? data.career_website.trim() : '';
    if (careerWebsite) {
      if (!/^https?:\/\//i.test(careerWebsite)) {
        careerWebsite = 'https://' + careerWebsite;
      }
      data.career_website = careerWebsite;
    }

    const selectedJobs = formData.getAll('available_jobs_select');
    const manualJobs = data.available_jobs_manual;

    let allJobs = [...selectedJobs];
    if (manualJobs && manualJobs.trim() !== '') {
      allJobs.push(manualJobs.trim());
    }
    data.available_jobs = allJobs.join(', ');

    delete data.available_jobs_select;
    delete data.available_jobs_manual;

    if (user && user.name) {
      data.submitter_name = user.name;
    }

    try {
      const response = await fetch('/api/update-hot-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        playChirp('success');

        // Update local state to reflect changes
        const updatedJobs = [...jobs];
        updatedJobs[currentIndex] = { ...currentJob, ...data };
        setJobs(updatedJobs);

        if (voiceActiveRef.current) {
          speak('Job successfully updated! Moving to next job.');
          setTimeout(() => {
            handleNext();
          }, 1500);
        } else {
          setMessage('Job successfully updated!');
        }
      } else {
        setSuccess(false);
        playChirp('error');
        if (voiceActiveRef.current) {
          speak('Failed to update job: ' + (result.error || 'Unknown error'));
        }
        setMessage(result.error || 'Failed to update Job.');
      }
    } catch (err) {
      setSuccess(false);
      playChirp('error');
      if (voiceActiveRef.current) {
        speak('Error connecting to server.');
      }
      setMessage('Error connecting to server.');
    }
    setSaving(false);
  };

  if (!categorySelected) {
    return (
      <div className="app-container">
        <div className="glass-panel main-form">
          <header>
            <h1>Review Hot Jobs</h1>
            <p className="subtitle">Select the type of jobs you want to update</p>
          </header>

          <div className="form-grid mt-2">
            <button className="btn primary-btn" onClick={() => fetchJobs('unverified_no_career')} style={{ height: 'auto', padding: '1.5rem', background: '#2980b9' }}>
              Phone Verification Queue
            </button>
            <button className="btn primary-btn" onClick={() => fetchJobs('5days')} style={{ height: 'auto', padding: '1.5rem' }}>
              Jobs Expiring in the next 5 days
            </button>
            <button className="btn primary-btn" onClick={() => fetchJobs('46weeks')} style={{ height: 'auto', padding: '1.5rem' }}>
              Jobs that have expired in the last 4-6 weeks
            </button>

            <div className="input-group full-width mt-2" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <label style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Or search by specific Job Type (Hold Ctrl/Cmd to select multiple from list, and/or enter custom text)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <select
                  multiple
                  size="5"
                  value={selectedJobTypes}
                  onChange={e => setSelectedJobTypes(Array.from(e.target.selectedOptions, option => option.value))}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.5rem' }}
                >
                  {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Or enter custom job type(s) / free text..."
                    value={jobTypeQuery}
                    onChange={e => setJobTypeQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn secondary-btn"
                    onClick={() => {
                      const combined = [...selectedJobTypes];
                      if (jobTypeQuery.trim()) {
                        combined.push(jobTypeQuery.trim());
                      }
                      fetchJobs('type', combined.join(', '));
                    }}
                    style={{ width: 'auto' }}
                    disabled={selectedJobTypes.length === 0 && !jobTypeQuery.trim()}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="actions mt-2" style={{ textAlign: 'center' }}>
            <button type="button" className="btn secondary-btn" onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')} style={{ width: 'auto' }}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="app-container"><div className="glass-panel main-form"><h2>Loading jobs...</h2></div></div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="app-container">
        <div className="glass-panel main-form">
          <header>
            <h1>{reviewTitle}</h1>
            <p className="subtitle">No jobs found matching this criteria.</p>
          </header>
          <div className="actions mt-2">
            <button type="button" className="btn secondary-btn" onClick={handleGoBack}>Go Back</button>
            <button type="button" className="btn primary-btn" onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container fade-in">
      <div className="glass-panel main-form">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{reviewTitle}</h1>
            <p className="subtitle">Review and update hot jobs</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Job {currentIndex + 1} of {jobs.length}</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Age: {currentJob.age_days} days
            </div>
          </div>
        </header>

        {/* VOICE ASSISTANT CONTROL HUD PANEL */}
        <div className="voice-assistant-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${(voiceActive && !isVoicePaused) ? 'mic-pulsing' : 'secondary-btn'}`}
                onClick={toggleVoiceActive}
                style={{ width: 'auto', padding: '0.6rem 1.2rem', gap: '0.5rem', display: 'inline-flex', alignItems: 'center' }}
                title="Press 'V' to toggle voice control"
              >
                <FaMicrophone />
                {voiceActive ? (isVoicePaused ? 'Voice Assistant PAUSED' : 'Voice Assistant ON') : 'Turn On Voice Assistant'}
              </button>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '220px' }}>
              <span
                className={`status-dot ${voiceActive && !speechStatus.includes('Error') && !speechStatus.includes('Denied') && !speechStatus.includes('Offline') ? 'active' : ''}`}
                style={{
                  background: (voiceActive && !speechStatus.includes('Error') && !speechStatus.includes('Denied') && !speechStatus.includes('Offline'))
                    ? (speechStatus === 'System speaking...' ? '#f1c40f' : 'var(--success)')
                    : (speechStatus.includes('Error') || speechStatus.includes('Denied')) ? 'var(--error)' : '#bdc3c7'
                }}
              ></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  {speechStatus}
                </span>
                {voiceActive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', minWidth: '55px' }}>Mic Level:</span>
                    <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(0,0,0,0.15)', height: '8px', borderRadius: '4px', flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          background: micVolume > 60 ? 'var(--error)' : micVolume > 15 ? 'var(--success)' : 'rgba(0,0,0,0.15)',
                          height: '100%',
                          width: `${micVolume}%`,
                          transition: 'width 0.08s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', minWidth: '25px', textAlign: 'right' }}>{micVolume}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {voiceActive && (
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.8rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>Last heard:</span>
                  <span style={{ fontStyle: 'italic', color: 'var(--primary-color)' }}>"{lastHeard || 'Speak a command...'}"</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                  *Microphone test: Mic Level moves when you make sound.
                </span>
              </div>

              <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                <span><strong>Commands:</strong></span>
                <span>• "Next job"</span>
                <span>• "Previous job"</span>
                <span>• "Read details"</span>
                <span>• "Update company type"</span>
                <span>• "Update job types"</span>
                <span>• "Update currently hiring status"</span>
                <span>• "Update notes"</span>
                <span>• "Call company"</span>
                <span>• "Pause"</span>
                <span>• "Resume"</span>
                <span>• "Save"</span>
                <span>• "Help"</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'rgba(241, 196, 15, 0.1)', borderLeft: '3px solid #f1c40f', padding: '0.4rem 0.8rem', borderRadius: '4px', marginTop: '0.4rem' }}>
                <strong>Troubleshooting:</strong> If <em>Mic Level</em> stays at 0%, click the lock/settings icon next to the URL in the address bar. Ensure "Microphone" is set to "Allow". If it is allowed, check Chrome Settings &gt; Privacy and security &gt; Site settings &gt; Microphone to verify the correct physical device is selected as your default.
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button type="button" className="btn secondary-btn" onClick={handlePrev} disabled={currentIndex === 0} style={{ width: 'auto' }}>
            &larr; Previous Job
          </button>
          <button type="button" className="btn secondary-btn" onClick={handleNext} disabled={currentIndex === jobs.length - 1} style={{ width: 'auto' }}>
            Next Job &rarr;
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} key={`${currentJob.row_index}-${updateKey}`}>
          {(() => {
            const existingJobs = (currentJob.available_jobs || '').split(',').map(s => s.trim()).filter(Boolean);
            const matchedJobs = existingJobs.filter(j => JOB_OPTIONS.includes(j));
            const unmatchedJobs = existingJobs.filter(j => !JOB_OPTIONS.includes(j));

            return (
              <div className="form-grid">
                <div className="input-group">
                  <label>Company Name <span className="required">*</span></label>
                  <input type="text" name="company_name" defaultValue={currentJob.company_name} required />
                </div>

                <div className="input-group">
                  <label>Company Type</label>
                  <input type="text" name="company_type" defaultValue={currentJob.company_type || ''} list="company-types" placeholder="Enter or select type..." />
                  <datalist id="company-types">
                    <option value="Call Center" />
                    <option value="Construction" />
                    <option value="Driving" />
                    <option value="Education" />
                    <option value="Fast Food" />
                    <option value="Government related" />
                    <option value="Healthcare" />
                    <option value="Hospitality" />
                    <option value="Janitorial" />
                    <option value="Non-Profit" />
                    <option value="Restaurant" />
                    <option value="Retail" />
                    <option value="Services" />
                    <option value="Technology" />
                    <option value="Theme Park" />
                    <option value="Vocation careers (HVAC, plumbing, electrical, etc)" />
                  </datalist>
                </div>

                <div className="input-group full-width">
                  <label>Company Street Address <span className="required">*</span></label>
                  <input type="text" name="company_street" defaultValue={currentJob.company_street} required />
                </div>

                <div className="input-group">
                  <label>City <span className="required">*</span></label>
                  <input type="text" name="company_city" defaultValue={currentJob.company_city} required />
                </div>

                <div className="input-group">
                  <label>Company State <span className="required">*</span></label>
                  <select name="company_state" defaultValue={currentJob.company_state || 'FL'} required>
                    <option value="">Select State...</option>
                    <option value="FL">Florida</option>
                    <option value="AL">Alabama</option>
                    <option value="GA">Georgia</option>
                    <option value="TX">Texas</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Company Zipcode <span className="required">*</span></label>
                  <input type="text" name="company_zip" defaultValue={currentJob.company_zip} required />
                </div>

                <div className="input-group full-width">
                  <label>Career Website URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" name="career_website" defaultValue={currentJob.career_website} style={{ flex: 1 }} />
                    {currentJob.career_website && (
                      <a href={currentJob.career_website.startsWith('http') ? currentJob.career_website : `https://${currentJob.career_website}`} target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ width: 'auto', padding: '0.8rem 1rem' }}>
                        Open Link
                      </a>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label>Hiring Contact Name</label>
                  <input type="text" name="contact_name" defaultValue={currentJob.contact_name} />
                </div>

                <div className="input-group">
                  <label>Hiring Contact Phone</label>
                  <input type="tel" name="contact_phone" defaultValue={currentJob.contact_phone} />
                </div>

                <div className="input-group">
                  <label>Hiring Contact Email</label>
                  <input type="email" name="contact_email" defaultValue={currentJob.contact_email} />
                </div>

                <div className="input-group">
                  <label>Currently Hiring <span className="required">*</span></label>
                  <select
                    name="currently_hiring"
                    defaultValue={
                      (currentJob.currently_hiring === 'TRUE' ||
                       currentJob.currently_hiring === 'Yes' ||
                       currentJob.currently_hiring === true ||
                       String(currentJob.currently_hiring).toUpperCase() === 'TRUE')
                        ? 'Yes'
                        : 'No'
                    }
                    required
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Available Jobs (Select multiple with Ctrl/Cmd, and/or enter manually)</label>
                  <select name="available_jobs_select" multiple size="6" defaultValue={matchedJobs}>
                    {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input type="text" name="available_jobs_manual" defaultValue={unmatchedJobs.join(', ')} placeholder="Other available jobs (comma separated)" style={{ marginTop: '0.5rem' }} />
                </div>

                <div className="input-group full-width">
                  <label>Additional Notes</label>
                  <textarea name="notes" rows="2" defaultValue={currentJob.notes}></textarea>
                </div>
              </div>
            );
          })()}

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: success ? '#27ae60' : '#c0392b' }}>
              {message}
            </div>
          )}

          <div className="actions mt-2 mb-1" style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn secondary-btn" onClick={handleGoBack}>Cancel</button>
            <button type="submit" className="btn primary-btn" disabled={saving}>
              {saving ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotJobsReview;
