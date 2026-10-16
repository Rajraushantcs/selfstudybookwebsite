// ==========================================================================
// SECTION 1: APP CONFIGURATION & GLOBAL STATE
// ==========================================================================
const APP_VERSION = "1.5"; // वर्ज़न कंट्रोल
const MASTER_INDEX_URL = "DATA/chapters_index.json"; // मास्टर JSON पाथ

const API_ENDPOINTS = {
    MATH_10TH: "DATA/10th/math/10th_maths_25_ques.json",
    MATH_9TH: "DATA/9th/math/9th_maths_25_ques.json"
};

const STORAGE_KEYS = {
    PROGRESS_9TH: "bseb_9th_math_set1_progress",
    PROGRESS_10TH: "bseb_10th_math_set1_progress"
};

const SCIENCE_10_PDF_URL = "https://storage.googleapis.com/selfstudybook-pdfs/PYQ/science_10_2025.pdf";
// ==========================================================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================================================
const SUPABASE_URL = "https://klezozcqqdenokucoqkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o7EWk_stl4EzUcEGBElTJA_5IINWWyA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

// Global Modal History Stack
let modalHistory = [];

// Universal Engine State
let masterChapterIndex = null; 
let currentPracticeData = null;
let currentPracticeAnswers = [];
let currentPracticeTitle = "";

// 9th Math State
let testData9th = null;
let currentQuestionIndex9th = 0;
let userAnswers9th = [];
let visitedQuestions9th = [];
let timeRemaining9th = 30 * 60;
let timerInterval9th = null;

// 10th Math State
let activeTestData10th = null;
let currentQuestionIndex10th = 0;
let userAnswers10th = [];
let visitedQuestions10th = [];
let timeRemaining10th = 30 * 60;
let timerInterval10th = null;


// ==========================================================================
// SECTION 2: MASTER INDEX LOADER
// ==========================================================================
async function loadMasterIndex() {
    try {
        const fetchUrl = MASTER_INDEX_URL + "?v=" + APP_VERSION;
        const res = await fetch(fetchUrl);
        masterChapterIndex = await res.json();
        console.log("Master Chapters Index Loaded Successfully v" + APP_VERSION);
    } catch (e) {
        console.error("Failed to load chapters_index.json from DATA folder.", e);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    loadMasterIndex();               // पहले से मौजूद था - चैप्टर्स लोड करेगा
    window.applyStudentAuthToUI();   // 🟢 नया जुड़ा - रिफ्रेश होने पर लॉगिन रीस्टोर करेगा
});


// ==========================================================================
// SECTION 3: CORE MODAL & SMART NAVIGATION ENGINE (BACK-BUTTON FIX)
// ==========================================================================
function showToast(message) {
    const toastMessage = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");

    if (!toastMessage || !toastText) return;
    toastText.innerText = message;
    toastMessage.classList.remove("hidden");
    setTimeout(() => toastMessage.classList.add("hidden"), 2500);
}

/**
 * डायनामिक पेज खोलने या री-रेंडर करने का फ़ंक्शन
 * @param {string} title - हेडर टाइटल
 * @param {string} htmlContent - HTML स्ट्रिंग
 * @param {boolean} isNewFlow - क्या यह नया फ्लो है (हिस्ट्री रीसेट)
 * @param {boolean} isUpdate - क्या केवल वर्तमान पेज को रिफ्रेश करना है (बिना हिस्ट्री बढ़ाए)
 */
window.openDynamicPage = function(title, htmlContent, isNewFlow = false, isUpdate = false) {
    if (isNewFlow) {
        modalHistory = [];
    }

    if (isUpdate && modalHistory.length > 0) {
        modalHistory[modalHistory.length - 1] = { title, htmlContent };
    } else {
        modalHistory.push({ title, htmlContent });
    }
    renderCurrentModalState();
};

function renderCurrentModalState() {
    const dynamicViewModal = document.getElementById("dynamic-view-modal");
    const dynamicViewTitle = document.getElementById("dynamic-view-title");
    const dynamicViewBody = document.getElementById("dynamic-view-body");

    if (modalHistory.length === 0) {
        closeDynamicPage();
        return;
    }

    const current = modalHistory[modalHistory.length - 1];

    if (dynamicViewTitle) dynamicViewTitle.innerText = current.title;
    if (dynamicViewBody) dynamicViewBody.innerHTML = current.htmlContent;
    
    if (dynamicViewModal) {
        dynamicViewModal.classList.remove("hidden");
        dynamicViewModal.classList.add("flex");
    }

    window.scrollTo(0, 0);
    if (window.lucide) lucide.createIcons();
}

// 🟢 स्टेप-बाय-स्टेप 1 स्तर पीछे जाने का ग्लोबल फ़ंक्शन
window.goBackModalStep = function() {
    if (modalHistory.length > 1) {
        modalHistory.pop();
        renderCurrentModalState();
    } else {
        closeDynamicPage();
    }
};

window.closeDynamicPage = function() {
    const dynamicViewModal = document.getElementById("dynamic-view-modal");
    if (timerInterval9th) clearInterval(timerInterval9th);
    if (timerInterval10th) clearInterval(timerInterval10th);
    modalHistory = [];
    if (dynamicViewModal) {
        dynamicViewModal.classList.add("hidden");
        dynamicViewModal.classList.remove("flex");
    }
};


// ==========================================================================
// SECTION 4: DEFAULT MODEL SETS, LIVE TESTS & PYQ PORTALS
// ==========================================================================
function generateSubjectButtonsHTML(classNum) {
    const subjects = [
        { id: 'science', name: '1. विज्ञान (Science)', isScience: true },
        { id: 'math', name: '2. गणित (Mathematics)', isScience: false },
        { id: 'sst', name: '3. सामाजिक विज्ञान (Social Science)', isScience: false },
        { id: 'hindi', name: '4. हिंदी (Hindi)', isScience: false },
        { id: 'sanskrit', name: '5. संस्कृत (Sanskrit)', isScience: false },
        { id: 'english', name: '6. अंग्रेजी (English)', isScience: false }
    ];

    return subjects.map(sub => {
        if (classNum === 10 && sub.isScience) {
            return `
                <a href="${SCIENCE_10_PDF_URL}" target="_blank" class="w-full text-left bg-rose-50 hover:bg-rose-100 border border-crimson p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all block">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="file-text" class="w-4 h-4 text-crimson"></i>
                        <span class="text-xs font-black text-crimson">${sub.name}</span>
                    </div>
                    <span class="bg-crimson text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <i data-lucide="download" class="w-3 h-3"></i>
                        <span>PDF Download</span>
                    </span>
                </a>`;
        } else {
            return `
                <button data-action="open-coming-soon-subject" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer">
                    <span class="text-xs font-bold text-slate-800">${sub.name}</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
                </button>`;
        }
    }).join('');
}

function openModelSetsPortal() {
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2 mb-3">
            <h2 class="text-base font-black text-slate-900">BSEB Model Sets (मॉडल सेट)</h2>
            <p class="text-xs text-slate-500 font-bold">अपनी कक्षा (Class) का चयन करें:</p>
        </div>
        <div class="space-y-3">
            <button data-action="open-10th-model-subjects" class="w-full text-left bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="award" class="w-6 h-6"></i>
                    <div>
                        <h3 class="text-xs font-black">Model Sets for Class 10th</h3>
                        <p class="text-[10px] text-rose-200 font-bold">Bihar Board Class 10th All Subjects</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-9th-model-subjects" class="w-full text-left bg-gradient-to-r from-sky-600 to-accentBlue text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="award" class="w-6 h-6"></i>
                    <div>
                        <h3 class="text-xs font-black">Model Sets for Class 9th</h3>
                        <p class="text-[10px] text-sky-200 font-bold">Bihar Board Class 9th All Subjects</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
        </div>`;
    openDynamicPage("Model Sets", htmlContent, true);
}

function renderModelSubjects(classNum) {
    const subjectsHTML = generateSubjectButtonsHTML(classNum);
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-crimson text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">Class ${classNum}th Model Sets</span>
            <h2 class="text-base font-black text-slate-900">विषयों की सूची (Subjects)</h2>
            <p class="text-[11px] text-slate-500 font-bold">मॉडल पेपर देखने या डाउनलोड करने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">${subjectsHTML}</div>`;
    openDynamicPage(`Model Sets for Class ${classNum}th`, htmlContent);
}

function openTestsPortal() {
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2 mb-3">
            <h2 class="text-base font-black text-slate-900">Online Live Test</h2>
            <p class="text-xs text-slate-500 font-bold">अपनी कक्षा (Class) का चयन करें:</p>
        </div>
        <div class="space-y-3">
            <button data-action="open-10th-test-subjects" class="w-full text-left bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="radio" class="w-6 h-6 animate-pulse"></i>
                    <div>
                        <h3 class="text-xs font-black">Live Test for Class 10th</h3>
                        <p class="text-[10px] text-rose-200 font-bold">Bihar Board Class 10th Live Tests</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-9th-test-subjects" class="w-full text-left bg-gradient-to-r from-sky-600 to-accentBlue text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="radio" class="w-6 h-6 animate-pulse"></i>
                    <div>
                        <h3 class="text-xs font-black">Live Test for Class 9th</h3>
                        <p class="text-[10px] text-sky-200 font-bold">Bihar Board Class 9th Live Tests</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
        </div>`;
    openDynamicPage("Live Test", htmlContent, true);
}

function renderTestSubjects(classNum) {
    const subjects = [
        { id: 'math', name: '1. गणित (Mathematics)', action: classNum === 10 ? 'open-10th-math-test' : 'open-9th-math-test' },
        { id: 'science', name: '2. विज्ञान (Science)', action: 'open-coming-soon-subject' },
        { id: 'sst', name: '3. सामाजिक विज्ञान (Social Science)', action: 'open-coming-soon-subject' },
        { id: 'hindi', name: '4. हिंदी (Hindi)', action: 'open-coming-soon-subject' },
        { id: 'sanskrit', name: '5. संस्कृत (Sanskrit)', action: 'open-coming-soon-subject' },
        { id: 'english', name: '6. अंग्रेजी (English)', action: 'open-coming-soon-subject' }
    ];

    let subjectsHTML = subjects.map(sub => `
        <button data-action="${sub.action}" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer">
            <span class="text-xs font-bold text-slate-800">${sub.name}</span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
        </button>`).join('');

    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-crimson text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">Class ${classNum}th Live Test</span>
            <h2 class="text-base font-black text-slate-900">विषयों की सूची (Subjects)</h2>
            <p class="text-[11px] text-slate-500 font-bold">लाइव टेस्ट देने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">${subjectsHTML}</div>`;
    openDynamicPage(`Live Test for Class ${classNum}th`, htmlContent);
}

function showComingSoonModal(subjectName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <h2 class="text-base font-black text-slate-900">${subjectName || 'Subject'}</h2>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p class="text-xs font-bold text-amber-900">जल्द ही अपलोड किया जाएगा!</p>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">इस विषय की सामग्री पर कार्य चल रहा है, बहुत जल्द उपलब्ध होगी।</p>
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform cursor-pointer">
                वापस जाएं (Back)
            </button>
        </div>`;
    openDynamicPage("Coming Soon", htmlContent);
}

function openPYQPortal() {
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2 mb-3">
            <h2 class="text-base font-black text-slate-900">Previous Year Questions (PYQ)</h2>
            <p class="text-xs text-slate-500 font-bold">पिछले वर्षों के प्रश्न पत्र (Question Bank):</p>
        </div>
        <div class="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-center space-y-3">
            <i data-lucide="file-text" class="w-10 h-10 text-amber-600 mx-auto"></i>
            <h3 class="text-xs font-black text-amber-900">BSEB PYQ Question Bank Uploading...</h3>
            <p class="text-[11px] text-slate-600">पिछले वर्षों के प्रश्न पत्र का संग्रह जल्द उपलब्ध होगा।</p>
            <button onclick="goBackModalStep()" class="bg-amber-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer">
                वापस जाएँ (Back)
            </button>
        </div>`;
    openDynamicPage("PYQ Question Bank", htmlContent, true);
}


// ==========================================================================
// SECTION 5: 🟢 UNIVERSAL CHAPTERWISE PRACTICE ENGINE 🟢
// ==========================================================================
function openChapterwisePracticePortal() {
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2 mb-3">
            <h2 class="text-base font-black text-slate-900">Chapterwise ऑनलाइन प्रैक्टिस</h2>
            <p class="text-xs text-slate-500 font-bold">अपनी कक्षा का चयन करें:</p>
        </div>
        <div class="grid grid-cols-1 gap-3">
            <button data-action="open-9th-chapterwise-subjects" class="w-full bg-gradient-to-r from-accentBlue to-blue-700 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-md active:scale-98 transition-transform cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                    <span>Class 9th Chapter Wise Practice</span>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-10th-chapterwise-subjects" class="w-full bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-md active:scale-98 transition-transform cursor-pointer">
                <div class="flex items-center space-x-3">
                    <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                    <span>Class 10th Chapter Wise Practice</span>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
        </div>`;
    openDynamicPage("Chapter Wise Practice", htmlContent, true);
}

function renderChapterwiseSubjects(className, isClass9 = true) {
    let subjects = isClass9 ? [
        { name: "1. विज्ञान (Science)", action: "open-9th-science-chapters", highlight: true },
        { name: "2. गणित (Mathematics)", action: "subject-coming-soon" },
        { name: "3. सामाजिक विज्ञान (Social Science)", action: "subject-coming-soon" },
        { name: "4. हिंदी (Hindi)", action: "subject-coming-soon" },
        { name: "5. संस्कृत (Sanskrit)", action: "subject-coming-soon" },
        { name: "6. अंग्रेजी (English)", action: "subject-coming-soon" }
    ] : [
        { name: "1. गणित (Mathematics)", action: "subject-coming-soon" },
        { name: "1. विज्ञान (Science)", action: "open-10th-science-chapters", highlight: true },
        { name: "3. सामाजिक विज्ञान (Social Science)", action: "subject-coming-soon" },
        { name: "4. हिंदी (Hindi)", action: "subject-coming-soon" },
        { name: "5. संस्कृत (Sanskrit)", action: "subject-coming-soon" },
        { name: "6. अंग्रेजी (English)", action: "subject-coming-soon" }
    ];

    let listHTML = subjects.map(sub => `
        <button data-action="${sub.action}" class="w-full bg-white hover:bg-rose-50 border ${sub.highlight ? 'border-crimson ring-1 ring-crimson/30' : 'border-slate-200'} p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-transform cursor-pointer">
            <span class="text-xs font-black ${sub.highlight ? 'text-crimson' : 'text-slate-800'}">${sub.name}</span>
            <i data-lucide="chevron-right" class="w-4 h-4 ${sub.highlight ? 'text-crimson' : 'text-slate-400'}"></i>
        </button>`).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-rose-100 text-crimson text-[10px] font-black px-2.5 py-0.5 rounded-full">${className}</span>
            <h2 class="text-base font-black text-slate-900">${className} विषयों की सूची</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रैक्टिस शुरू करने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">${listHTML}</div>`;

    openDynamicPage(`${className} Subjects`, pageHTML);
}

function openSubjectChapters(className, subjectKey) {
    if (!masterChapterIndex) {
        loadMasterIndex();
        return;
    }

    const classData = masterChapterIndex[`class_${className}`];
    if (!classData || !classData[subjectKey]) {
        showToast("इस विषय के चैप्टर्स अभी उपलब्ध नहीं हैं।");
        return;
    }

    const chapters = classData[subjectKey];

    let chaptersHTML = chapters.map((chap, index) => {
        const action = chap.json_url ? "open-universal-practice" : "chapter-coming-soon";
        return `
        <button data-action="${action}" data-json-url="${chap.json_url}" data-chapter-name="${chap.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 hover:border-crimson p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer">
            <div class="flex items-center space-x-3">
                <div class="w-7 h-7 rounded-lg bg-rose-100 text-crimson font-black text-xs flex items-center justify-center flex-none">
                    ${index + 1}
                </div>
                <span class="text-xs font-bold text-slate-800 leading-snug">${chap.name}</span>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 flex-none ml-2"></i>
        </button>`;
    }).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Class ${className} ${subjectKey.toUpperCase()}</span>
            <h2 class="text-base font-black text-slate-900">विषय सूची (Chapter List)</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रैक्टिस करने के लिए किसी भी अध्याय पर क्लिक करें:</p>
        </div>
        <div class="space-y-2">${chaptersHTML}</div>`;

    openDynamicPage(`Class ${className} ${subjectKey}`, pageHTML);
}

async function startUniversalPractice(jsonUrl, chapterTitle) {
    try {
        const fetchUrl = jsonUrl + "?v=" + APP_VERSION;
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("Network response was not ok");
        const questions = await res.json();
        
        currentPracticeData = questions;
        currentPracticeTitle = chapterTitle;
        currentPracticeAnswers = new Array(questions.length).fill(null);
        
        renderUniversalPracticeUI(false);
    } catch (e) {
        showToast("कृपया बाद में प्रयास करें...");
        console.error("Universal Practice Load Error:", e);
    }
}

function renderUniversalPracticeUI(isUpdate = false) {
    let questionsHTML = currentPracticeData.map((q, qIdx) => {
        const selectedOpt = currentPracticeAnswers[qIdx];
        const isAnswered = selectedOpt !== null;

        let optionsList = [];
        let correctAnswerIndex = -1;

        if (Array.isArray(q.options)) {
             optionsList = q.options;
             correctAnswerIndex = q.answer;
        } else if (typeof q.options === 'object') {
             optionsList = Object.values(q.options);
             const keys = Object.keys(q.options);
             correctAnswerIndex = keys.indexOf(q.correct_answer); 
        }

        let optionsHTML = optionsList.map((optText, optIdx) => {
            let btnStyle = "bg-white border-slate-200 text-slate-800 hover:bg-slate-50";

            if (isAnswered) {
                if (optIdx === correctAnswerIndex) {
                    btnStyle = "bg-emerald-100 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-500";
                } else if (selectedOpt === optIdx) {
                    btnStyle = "bg-rose-100 border-rose-600 text-rose-900 font-bold ring-2 ring-rose-500";
                } else {
                    btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                }
            }

            return `
                <button onclick="handleUniversalOptionSelect(${qIdx}, ${optIdx})" ${isAnswered ? 'disabled' : ''} class="w-full text-left p-3.5 rounded-xl border text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-between cursor-pointer ${btnStyle}">
                    <span>${String.fromCharCode(65 + optIdx)}) ${optText}</span>
                    ${isAnswered && optIdx === correctAnswerIndex ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-none"></i>' : ''}
                    ${isAnswered && selectedOpt === optIdx && selectedOpt !== correctAnswerIndex ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-600 flex-none"></i>' : ''}
                </button>`;
        }).join('');

        let explanationHTML = "";
        if (isAnswered) {
            const isCorrect = selectedOpt === correctAnswerIndex;
            explanationHTML = `
                <div class="mt-3 p-3.5 rounded-2xl ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'} space-y-1 animate-fadeIn">
                    <div class="flex items-center space-x-1.5 text-xs font-black ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}">
                        <i data-lucide="${isCorrect ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
                        <span>${isCorrect ? 'सही उत्तर!' : `गलत उत्तर! सही विकल्प (${String.fromCharCode(65 + correctAnswerIndex)}) है।`}</span>
                    </div>
                    <p class="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed pt-0.5">
                        <span class="font-bold text-slate-900">व्याख्या:</span> ${q.explanation || "कोई व्याख्या उपलब्ध नहीं है।"}
                    </p>
                </div>`;
        }

        return `
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 mb-4">
                <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">Q${qIdx + 1}. ${q.question}</h3>
                <div class="space-y-2">${optionsHTML}</div>
                ${explanationHTML}
            </div>`;
    }).join('');

    const pageContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3 sticky top-0 z-10">
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">Chapterwise Practice</span>
            <h2 class="text-base font-black text-slate-900">${currentPracticeTitle}</h2>
        </div>
        <div class="pb-6">${questionsHTML}</div>`;

    openDynamicPage("Practice Test", pageContent, false, isUpdate);
}

window.handleUniversalOptionSelect = function(qIdx, optIdx) {
    currentPracticeAnswers[qIdx] = optIdx;
    renderUniversalPracticeUI(true);
};

function showChapterComingSoonModal(chapName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <h2 class="text-base font-black text-slate-900">${chapName || 'यह चैप्टर'}</h2>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p class="text-xs font-bold text-amber-900">जल्द ही प्रैक्टिस Questions अपलोड किए जाएंगे!</p>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">इस चैप्टर के प्रश्न उत्तर और ऑनलाइन टेस्ट पर कार्य चल रहा है।</p>
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform cursor-pointer">
                वापस जाएं (Back)
            </button>
        </div>`;
    openDynamicPage("Practice Set", htmlContent);
}


// ==========================================================================
// SECTION 6: MATHEMATICS TIMED TESTS (CLASS 9 & 10)
// ==========================================================================

// --- CLASS 9 MATH ENGINE ---
window.startBSEB9thMathTest = async function() {
    try {
        const fetchUrl9th = API_ENDPOINTS.MATH_9TH + "?v=" + APP_VERSION;
        const response = await fetch(fetchUrl9th, { headers: { "Accept": "application/json" } });
        const jsonData = await response.json();
        const questionsList = Array.isArray(jsonData) ? jsonData : (jsonData.questions || []);

        testData9th = { title: "BSEB 9th Mathematics Model Set 1", questions: questionsList };
        const totalQ = testData9th.questions.length;
        const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS_9TH);

        if (savedProgress) {
            if (confirm("आपने पहले यह टेस्ट अधूरा छोड़ा था। क्या आप वहीं से शुरू (Resume) करना चाहते हैं?")) {
                const data = JSON.parse(savedProgress);
                currentQuestionIndex9th = data.currentQuestionIndex || 0;
                userAnswers9th = data.userAnswers || new Array(totalQ).fill(null);
                visitedQuestions9th = data.visitedQuestions || new Array(totalQ).fill(false);
                timeRemaining9th = data.timeRemaining || 30 * 60;
            } else {
                localStorage.removeItem(STORAGE_KEYS.PROGRESS_9TH);
                resetTestData9th(totalQ);
            }
        } else {
            resetTestData9th(totalQ);
        }

        renderQuizUI9th();
        renderQuestion9th(currentQuestionIndex9th);
        startTimer9th();
    } catch (error) {
        showToast("Error loading 9th math test.");
    }
};

function resetTestData9th(totalQ) {
    currentQuestionIndex9th = 0;
    userAnswers9th = new Array(totalQ).fill(null);
    visitedQuestions9th = new Array(totalQ).fill(false);
    visitedQuestions9th[0] = true;
    timeRemaining9th = 30 * 60;
}

function autoSaveProgress9th() {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_9TH, JSON.stringify({
        currentQuestionIndex: currentQuestionIndex9th, userAnswers: userAnswers9th, 
        visitedQuestions: visitedQuestions9th, timeRemaining: timeRemaining9th
    }));
}

function renderQuizUI9th() {
    const totalQ = testData9th.questions.length;
    const testUIHTML = `
        <div class="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md mb-2">
            <div>
                <h2 class="text-xs font-black text-rose-400">${testData9th.title}</h2>
                <p class="text-[10px] text-slate-400 font-bold">${totalQ} Questions • Live Test</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="pauseQuiz9th()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1 cursor-pointer">
                    <i data-lucide="pause" class="w-3 h-3 fill-current"></i><span>Pause</span>
                </button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-rose-500/30 flex items-center space-x-1 text-rose-400 font-mono text-xs font-bold">
                    <i data-lucide="timer" class="w-3.5 h-3.5"></i><span id="quiz-timer-9th">30:00</span>
                </div>
            </div>
        </div>
        <div id="quiz-question-card" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span id="q-badge-9th" class="bg-rose-100 text-crimson text-[10px] font-black px-2.5 py-0.5 rounded-full">Question 1 of ${totalQ}</span>
                <span class="text-[10px] text-slate-400 font-bold">+1 Mark</span>
            </div>
            <h3 id="q-text-9th" class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pt-1"></h3>
            <div id="q-options-9th" class="space-y-2 pt-1"></div>
        </div>
        <div class="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <button id="prev-btn-9th" onclick="navigateQuestion9th(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer">Previous</button>
            <button onclick="clearChoice9th()" class="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer">Clear Choice</button>
            <button id="next-btn-9th" onclick="navigateQuestion9th(1)" class="bg-crimson hover:bg-rose-900 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm cursor-pointer">Next</button>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 mt-2">
            <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4>
                <span class="text-[10px] text-slate-400">Tap to jump</span>
            </div>
            <div id="question-palette-9th" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinalQuiz9th()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all cursor-pointer">SUBMIT TEST NOW</button>
        </div>`;
    openDynamicPage("Live Mathematics Test Engine", testUIHTML, true);
}

window.renderQuestion9th = function(index) {
    const q = testData9th.questions[index];
    visitedQuestions9th[index] = true;
    autoSaveProgress9th();

    document.getElementById("q-badge-9th").innerText = `Question ${index + 1} of ${testData9th.questions.length}`;
    document.getElementById("q-text-9th").innerHTML = q.question;

    const container = document.getElementById("q-options-9th");
    container.innerHTML = q.options.map((opt, optIdx) => `
        <label onclick="selectOption9th(${index}, ${optIdx})" class="flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
            userAnswers9th[index] === optIdx ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
        }">
            <input type="radio" name="opt9" ${userAnswers9th[index] === optIdx ? 'checked' : ''} class="accent-emerald-600 w-4 h-4">
            <span class="text-xs sm:text-sm">${String.fromCharCode(65 + optIdx)}) ${opt}</span>
        </label>`).join('');

    document.getElementById("prev-btn-9th").disabled = (index === 0);
    renderPalette9th();
};

window.selectOption9th = function(qIdx, optIdx) { userAnswers9th[qIdx] = optIdx; renderQuestion9th(qIdx); };
window.clearChoice9th = function() { userAnswers9th[currentQuestionIndex9th] = null; renderQuestion9th(currentQuestionIndex9th); };
window.navigateQuestion9th = function(step) {
    currentQuestionIndex9th += step;
    if (currentQuestionIndex9th < 0) currentQuestionIndex9th = 0;
    if (currentQuestionIndex9th >= testData9th.questions.length) currentQuestionIndex9th = testData9th.questions.length - 1;
    renderQuestion9th(currentQuestionIndex9th);
};
window.jumpToQuestion9th = function(index) { currentQuestionIndex9th = index; renderQuestion9th(index); };

window.renderPalette9th = function() {
    const palette = document.getElementById("question-palette-9th");
    palette.innerHTML = testData9th.questions.map((_, idx) => {
        let btnStatusClass = "bg-slate-100 text-slate-600 border-slate-200";
        if (userAnswers9th[idx] !== null) btnStatusClass = "bg-emerald-500 text-white border-emerald-600 font-black";
        else if (visitedQuestions9th[idx]) btnStatusClass = "bg-amber-500 text-white border-amber-600";
        if (idx === currentQuestionIndex9th) btnStatusClass += " ring-2 ring-rose-600 ring-offset-1";
        return `<button onclick="jumpToQuestion9th(${idx})" class="w-8 h-8 text-[11px] rounded-lg font-bold border flex items-center justify-center transition-all cursor-pointer ${btnStatusClass}">${idx + 1}</button>`;
    }).join('');
};

window.pauseQuiz9th = function() {
    if (timerInterval9th) clearInterval(timerInterval9th);
    autoSaveProgress9th();
    alert("आपका टेस्ट पॉज़ कर दिया गया है।");
    closeDynamicPage();
};

window.startTimer9th = function() {
    if (timerInterval9th) clearInterval(timerInterval9th);
    const timerElem = document.getElementById("quiz-timer-9th");
    timerInterval9th = setInterval(() => {
        let mins = Math.floor(timeRemaining9th / 60);
        let secs = timeRemaining9th % 60;
        if (timerElem) timerElem.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (--timeRemaining9th < 0) {
            clearInterval(timerInterval9th);
            alert("समय समाप्त! टेस्ट ऑटो-सबमिट हो गया है।");
            submitFinalQuiz9th();
        }
    }, 1000);
};

window.submitFinalQuiz9th = function() {
    if (timerInterval9th) clearInterval(timerInterval9th);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS_9TH);

    let score = 0, correctCount = 0, wrongCount = 0, unattemptedCount = 0;
    const totalQ = testData9th.questions.length;
    let solutionsHTML = "";

    testData9th.questions.forEach((q, idx) => {
        const userAnsIdx = userAnswers9th[idx];
        const isCorrect = (userAnsIdx === q.answer);
        let statusBadge = "", cardBorder = "";

        if (userAnsIdx === null) {
            unattemptedCount++; statusBadge = `<span class="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">छोड़ा गया</span>`; cardBorder = "border-slate-200 bg-slate-50/50";
        } else if (isCorrect) {
            score++; correctCount++; statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">✓ सही</span>`; cardBorder = "border-emerald-300 bg-emerald-50/30";
        } else {
            wrongCount++; statusBadge = `<span class="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md">✗ गलत</span>`; cardBorder = "border-rose-300 bg-rose-50/30";
        }

        solutionsHTML += `
            <div class="p-3.5 rounded-2xl border ${cardBorder} text-left space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span class="text-xs font-black text-slate-800">Q${idx + 1}. ${q.question}</span>${statusBadge}
                </div>
                <div class="text-[11px] font-bold space-y-1 pt-1">
                    <p class="text-slate-600">आपका उत्तर: <span class="${isCorrect ? 'text-emerald-700' : 'text-rose-600'} font-black">${userAnsIdx !== null ? q.options[userAnsIdx] : 'नहीं चुना'}</span></p>
                    <p class="text-emerald-700">सही उत्तर: <span class="font-black">${q.options[q.answer]}</span></p>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 mt-2">
                    <span class="font-black text-slate-900 block mb-0.5">व्याख्या:</span>${q.explanation || "कोई व्याख्या उपलब्ध नहीं है।"}
                </div>
            </div>`;
    });

    const scoreHTML = `
        <div class="bg-white p-4 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">✓</div>
            <div><h2 class="text-base font-black text-slate-900">Test Result Summary</h2><p class="text-[11px] text-slate-500 font-bold">${testData9th.title}</p></div>
            <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 space-y-0.5">
                <div class="text-2xl font-black text-emerald-700">${score} /${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">Sahi: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">Galat: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">Chhode: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2"><h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल</h3><div class="space-y-3">${solutionsHTML}</div></div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0 cursor-pointer">Finish & Close</button>
        </div>`;
    openDynamicPage("Scorecard Result", scoreHTML, true);
};

// --- CLASS 10 MATH ENGINE ---
window.startBSEB10thMathTest = async function() {
    try {
        const fetchUrl10th = API_ENDPOINTS.MATH_10TH + "?v=" + APP_VERSION;
        const response = await fetch(fetchUrl10th);
        const jsonData = await response.json();
        activeTestData10th = Array.isArray(jsonData) ? { questions: jsonData, title: "10th Mathematics Model Set" } : jsonData;

        const totalQ = activeTestData10th.questions.length;
        const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS_10TH);

        if (savedProgress) {
            if (confirm("आपने 10वीं कक्षा का टेस्ट पहले अधूरा छोड़ा था। क्या आप वहीं से शुरू (Resume) करना चाहते हैं?")) {
                const data = JSON.parse(savedProgress);
                currentQuestionIndex10th = data.currentQuestionIndex || 0;
                userAnswers10th = data.userAnswers || new Array(totalQ).fill(null);
                visitedQuestions10th = data.visitedQuestions || new Array(totalQ).fill(false);
                timeRemaining10th = data.timeRemaining || 30 * 60;
            } else {
                localStorage.removeItem(STORAGE_KEYS.PROGRESS_10TH);
                reset10thTestData(totalQ);
            }
        } else {
            reset10thTestData(totalQ);
        }

        render10thQuizUI();
        render10thQuestion(currentQuestionIndex10th);
        start10thTimer();
    } catch (error) {
        showToast("Error: JSON File load nahi ho saki.");
    }
};

function reset10thTestData(totalQ) {
    currentQuestionIndex10th = 0;
    userAnswers10th = new Array(totalQ).fill(null);
    visitedQuestions10th = new Array(totalQ).fill(false);
    visitedQuestions10th[0] = true;
    timeRemaining10th = 30 * 60;
}

function autoSave10thProgress() {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_10TH, JSON.stringify({ 
        currentQuestionIndex: currentQuestionIndex10th, userAnswers: userAnswers10th, 
        visitedQuestions: visitedQuestions10th, timeRemaining: timeRemaining10th 
    }));
}

function render10thQuizUI() {
    const totalQ = activeTestData10th.questions.length;
    const testUIHTML = `
        <div class="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md mb-2">
            <div><h2 class="text-xs font-black text-sky-400">${activeTestData10th.title}</h2><p class="text-[10px] text-slate-400 font-bold">${totalQ} Questions • Live Test</p></div>
            <div class="flex items-center space-x-2">
                <button onclick="pause10thQuiz()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1 cursor-pointer"><i data-lucide="pause" class="w-3 h-3 fill-current"></i><span>Pause</span></button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-sky-500/30 flex items-center space-x-1 text-sky-400 font-mono text-xs font-bold"><i data-lucide="timer" class="w-3.5 h-3.5"></i><span id="quiz-10th-timer">30:00</span></div>
            </div>
        </div>
        <div id="quiz-question-card-10th" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2"><span id="q10-badge" class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Question 1 of ${totalQ}</span><span class="text-[10px] text-slate-400 font-bold">+1 Mark</span></div>
            <h3 id="q10-text" class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pt-1"></h3>
            <div id="q10-options" class="space-y-2 pt-1"></div>
        </div>
        <div class="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <button id="prev-10th-btn" onclick="navigate10thQuestion(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer">Previous</button>
            <button onclick="clear10thChoice()" class="text-[11px] text-sky-600 font-bold hover:underline cursor-pointer">Clear Choice</button>
            <button id="next-10th-btn" onclick="navigate10thQuestion(1)" class="bg-accentBlue hover:bg-sky-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm cursor-pointer">Next</button>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 mt-2">
            <div class="flex items-center justify-between"><h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4></div>
            <div id="question-palette-10th" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinal10thQuiz()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all cursor-pointer">SUBMIT TEST NOW</button>
        </div>`;
    openDynamicPage("Class 10th Mathematics Test", testUIHTML, true);
}

window.render10thQuestion = function(index) {
    const q = activeTestData10th.questions[index];
    visitedQuestions10th[index] = true;
    autoSave10thProgress();

    document.getElementById("q10-badge").innerText = `Question ${index + 1} of${activeTestData10th.questions.length}`;
    document.getElementById("q10-text").innerHTML = q.question;

    const container = document.getElementById("q10-options");
    container.innerHTML = q.options.map((opt, optIdx) => `
        <label onclick="select10thOption(${index},${optIdx})" class="flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${userAnswers10th[index] === optIdx ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'}">
            <input type="radio" name="opt10" ${userAnswers10th[index] === optIdx ? 'checked' : ''} class="accent-emerald-600 w-4 h-4"><span class="text-xs sm:text-sm">${opt}</span>
        </label>`).join('');

    document.getElementById("prev-10th-btn").disabled = (index === 0);
    render10thPalette();
};

window.select10thOption = function(qIdx, optIdx) { userAnswers10th[qIdx] = optIdx; render10thQuestion(qIdx); };
window.clear10thChoice = function() { userAnswers10th[currentQuestionIndex10th] = null; render10thQuestion(currentQuestionIndex10th); };
window.navigate10thQuestion = function(step) {
    currentQuestionIndex10th += step;
    if (currentQuestionIndex10th < 0) currentQuestionIndex10th = 0;
    if (currentQuestionIndex10th >= activeTestData10th.questions.length) currentQuestionIndex10th = activeTestData10th.questions.length - 1;
    render10thQuestion(currentQuestionIndex10th);
};
window.jumpTo10thQuestion = function(index) { currentQuestionIndex10th = index; render10thQuestion(index); };

window.render10thPalette = function() {
    const palette = document.getElementById("question-palette-10th");
    palette.innerHTML = activeTestData10th.questions.map((_, idx) => {
        let btnStatusClass = "bg-slate-100 text-slate-600 border-slate-200";
        if (userAnswers10th[idx] !== null) btnStatusClass = "bg-emerald-500 text-white border-emerald-600 font-black";
        else if (visitedQuestions10th[idx]) btnStatusClass = "bg-amber-500 text-white border-amber-600";
        if (idx === currentQuestionIndex10th) btnStatusClass += " ring-2 ring-sky-600 ring-offset-1";
        return `<button onclick="jumpTo10thQuestion(${idx})" class="w-8 h-8 text-[11px] rounded-lg font-bold border flex items-center justify-center transition-all cursor-pointer ${btnStatusClass}">${idx + 1}</button>`;
    }).join('');
};

window.pause10thQuiz = function() {
    if (timerInterval10th) clearInterval(timerInterval10th);
    autoSave10thProgress();
    alert("आपका टेस्ट पॉज़ कर दिया गया है।");
    closeDynamicPage();
};

window.start10thTimer = function() {
    if (timerInterval10th) clearInterval(timerInterval10th);
    const timerElem = document.getElementById("quiz-10th-timer");
    timerInterval10th = setInterval(() => {
        let mins = Math.floor(timeRemaining10th / 60);
        let secs = timeRemaining10th % 60;
        if (timerElem) timerElem.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (--timeRemaining10th < 0) {
            clearInterval(timerInterval10th);
            alert("समय समाप्त! 10th Class का टेस्ट ऑटो-सबमिट हो गया है।");
            submitFinal10thQuiz();
        }
    }, 1000);
};

window.submitFinal10thQuiz = function() {
    if (timerInterval10th) clearInterval(timerInterval10th);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS_10TH);

    let score = 0, correctCount = 0, wrongCount = 0, unattemptedCount = 0;
    const totalQ = activeTestData10th.questions.length;
    let solutionsHTML = "";

    activeTestData10th.questions.forEach((q, idx) => {
        const userAnsIdx = userAnswers10th[idx];
        const selectedOptionText = userAnsIdx !== null ? q.options[userAnsIdx] : null;
        const isCorrect = (selectedOptionText === q.answer);
        let statusBadge = "", cardBorder = "";

        if (userAnsIdx === null) {
            unattemptedCount++; statusBadge = `<span class="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">छोड़ा गया</span>`; cardBorder = "border-slate-200 bg-slate-50/50";
        } else if (isCorrect) {
            score++; correctCount++; statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">✓ सही</span>`; cardBorder = "border-emerald-300 bg-emerald-50/30";
        } else {
            wrongCount++; statusBadge = `<span class="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md">✗ गलत</span>`; cardBorder = "border-rose-300 bg-rose-50/30";
        }

        solutionsHTML += `
            <div class="p-3.5 rounded-2xl border ${cardBorder} text-left space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span class="text-xs font-black text-slate-800">Q${idx + 1}. ${q.question}</span>${statusBadge}
                </div>
                <div class="text-[11px] font-bold space-y-1 pt-1">
                    <p class="text-slate-600">उत्तर: <span class="${isCorrect ? 'text-emerald-700' : 'text-rose-600'} font-black">${selectedOptionText ? selectedOptionText : 'कोई विकल्प नहीं चुना'}</span></p>
                    <p class="text-emerald-700">सही उत्तर: <span class="font-black">${q.answer}</span></p>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 mt-2">
                    <span class="font-black text-slate-900 block mb-0.5">व्याख्या:</span>${q.explanation || "कोई व्याख्या उपलब्ध नहीं है।"}
                </div>
            </div>`;
    });

    const scoreHTML = `
        <div class="bg-white p-4 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">✓</div>
            <div><h2 class="text-base font-black text-slate-900">Test Result Summary</h2><p class="text-[11px] text-slate-500 font-bold">${activeTestData10th.title}</p></div>
            <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 space-y-0.5">
                <div class="text-2xl font-black text-emerald-700">${score} /${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">Sahi: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">Galat: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">Chhode: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2"><h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल</h3><div class="space-y-3">${solutionsHTML}</div></div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0 cursor-pointer">Finish & Close</button>
        </div>`;
    openDynamicPage("Scorecard Result", scoreHTML, true);
};


// ==========================================================================
// SECTION 7: GLOBAL EVENT LISTENERS & ROUTING
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    window.applyStudentAuthToUI();
    if (window.lucide) lucide.createIcons();

    const sideMenuOverlay = document.getElementById("side-menu-overlay");
    const sideMenuContent = document.getElementById("side-menu-content");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    const closeViewBtn = document.getElementById("close-view-btn");

    function openSideMenu() {
        if (!sideMenuOverlay || !sideMenuContent) return;
        sideMenuOverlay.classList.remove("hidden");
        setTimeout(() => sideMenuContent.classList.remove("-translate-x-full"), 10);
    }

    window.closeSideMenuDirect = function() {
        if (!sideMenuOverlay || !sideMenuContent) return;
        sideMenuContent.classList.add("-translate-x-full");
        setTimeout(() => sideMenuOverlay.classList.add("hidden"), 200);
    };

    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if (!target) return;

        const action = target.getAttribute("data-action");

        switch (action) {
            case "toggle-menu":
            case "open-menu": openSideMenu(); break;
            case "quick-model-sets":
            case "open-model-sets": openModelSetsPortal(); break;
            case "quick-tests":
            case "open-tests": openTestsPortal(); break;
            case "quick-pyq":
            case "open-pyq": openPYQPortal(); break;
            case "open-10th-model-subjects": renderModelSubjects(10); break;
            case "open-9th-model-subjects": renderModelSubjects(9); break;
            case "open-10th-test-subjects": renderTestSubjects(10); break;
            case "open-9th-test-subjects": renderTestSubjects(9); break;
            case "open-chapterwise-practice": openChapterwisePracticePortal(); break;
            case "open-9th-chapterwise-subjects": renderChapterwiseSubjects("Class 9th", true); break;
            case "open-10th-chapterwise-subjects": renderChapterwiseSubjects("Class 10th", false); break;
            case "open-10th-math-test": startBSEB10thMathTest(); break;
            case "open-9th-math-test": startBSEB9thMathTest(); break;
            
            case "open-9th-science-chapters":
                openSubjectChapters("9", "science");
                break;
            case "open-10th-science-chapters":
                openSubjectChapters("10", "science");
                break;
                
            case "open-universal-practice":
                const jsonUrl = target.getAttribute("data-json-url");
                const chapterName = target.getAttribute("data-chapter-name");
                if (jsonUrl && jsonUrl !== "null" && jsonUrl !== "") {
                    startUniversalPractice(jsonUrl, chapterName);
                }
                break;
                
            case "chapter-coming-soon":
                const pendingChapName = target.getAttribute("data-chapter-name");
                showChapterComingSoonModal(pendingChapName);
                break;

            case "open-coming-soon-subject":
                showComingSoonModal(target.getAttribute("data-subject"));
                break;
            case "buy-book":
                const bookId = target.getAttribute("data-book-id");
                window.open(`https://wa.me/919128919447?text=Hi%20Raj%20Sir,%20I%20want%20to%20order%20Book%20ID:%20${bookId}`, "_blank");
                break;
            case "coming-soon":
                showToast("बहुत ही जल्द यह सुविधा चालू होगी!");
                break;
            case "subject-coming-soon":
                showToast("यह विषय बहुत जल्द अपलोड किया जाएगा!");
                break;
            case "open-pyq-chapterwise-portal":
                openPYQSubjectsPortal();
                break;

            // 🟢 SIDEBAR AUTH & NAV ACTIONS
            case "open-signup-modal":
                window.closeSideMenuDirect();
                window.openStudentSignupModal();
                break;
            case "open-login-modal":
                window.closeSideMenuDirect();
                window.openStudentLoginModal();
                break;
            case "open-edit-profile-modal":
                window.closeSideMenuDirect();
                window.openStudentProfileEditModal();
                break;
            case "open-my-orders-modal":
                window.closeSideMenuDirect();
                window.openMyOrdersModal();
                break;
            case "goto-help-support":
                window.redirectToHelpSupport();
                break;
            case "goto-about-sir":
                window.redirectToAboutSir();
                break;
        }
    });

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", window.closeSideMenuDirect);
    if (sideMenuOverlay) sideMenuOverlay.addEventListener("click", (e) => { if (e.target === sideMenuOverlay) window.closeSideMenuDirect(); });
    
    // 🟢 टॉप हेडर बैक बटन: सीधे 1 स्तर पीछे ले जाएगा
    if (closeViewBtn) closeViewBtn.addEventListener("click", () => {
        goBackModalStep();
    });
});


// ==========================================================================
// SECTION 8: 🟣 PYQ CHAPTERWISE PORTAL (CLEAN & MODULAR)
// ==========================================================================

const PYQ_MASTER_SUBJECTS = [
    {
        id: "science",
        name: "विज्ञान (Science)",
        subtext: "Physics, Chemistry & Biology PYQs",
        icon: "flask-conical",
        theme: "from-blue-600 to-indigo-700",
        border: "border-blue-200",
        chapters: [
            { id: 1, name: "1. रासायनिक अभिक्रियाएँ एवं समीकरण", json_url: "DATA/10th/science/ch1_ques.json" },
            { id: 2, name: "2. अम्ल, क्षारक एवं लवण", json_url: "DATA/10th/science/ch2_ques.json" },
            { id: 3, name: "3. धातु एवं अधातु", json_url: "DATA/10th/science/ch3_ques.json" },
            { id: 4, name: "4. कार्बन एवं उसके यौगिक", json_url: "DATA/10th/science/ch4_ques.json" },
            { id: 5, name: "5. तत्वों का आवर्त वर्गीकरण", json_url: "DATA/10th/science/ch5_ques.json" },
            { id: 6, name: "6. जैव प्रक्रम", json_url: "DATA/10th/science/ch6_ques.json" },
            { id: 7, name: "7. नियंत्रण एवं समन्वय", json_url: "DATA/10th/science/ch7_ques.json" },
            { id: 8, name: "8. जीव जनन कैसे करते हैं?", json_url: "DATA/10th/science/ch8_ques.json" },
            { id: 9, name: "9. आनुवंशिकता एवं जैव विकास", json_url: "DATA/10th/science/ch9_ques.json" },
            { id: 10, name: "10. प्रकाश - परावर्तन तथा अपवर्तन", json_url: "DATA/10th/science/ch10_ques.json" },
            { id: 11, name: "11. मानव नेत्र तथा रंगबिरंगा संसार", json_url: "DATA/10th/science/ch11_ques.json" },
            { id: 12, name: "12. विद्युत", json_url: "DATA/10th/science/ch12_ques.json" },
            { id: 13, name: "13. विद्युत धारा के चुंबकीय प्रभाव", json_url: "DATA/10th/science/ch13_ques.json" },
            { id: 14, name: "14. ऊर्जा के स्रोत", json_url: "DATA/10th/science/ch14_ques.json" },
            { id: 15, name: "15. हमारा पर्यावरण", json_url: "DATA/10th/science/ch15_ques.json" },
            { id: 16, name: "16. प्राकृतिक संसाधनों का प्रबंधन", json_url: "DATA/10th/science/ch16_ques.json" }
        ]
    },
    {
        id: "hindi",
        name: "हिंदी (Hindi - गोधूलि)",
        subtext: "गद्यखंड एवं पद्यखंड PYQs",
        icon: "book-open",
        theme: "from-rose-600 to-crimson",
        border: "border-rose-200",
        chapters: [
            { id: 1, name: "1. श्रम विभाजन और जाति प्रथा", json_url: "DATA/10th/hindi/ch1.json" },
            { id: 2, name: "2. विष के दाँत", json_url: "DATA/10th/hindi/ch2.json" },
            { id: 3, name: "3. भारत से हम क्या सीखें", json_url: "DATA/10th/hindi/ch3.json" },
            { id: 4, name: "4. नाखून क्यों बढ़ते हैं", json_url: "DATA/10th/hindi/ch4.json" },
            { id: 5, name: "5. नागरी लिपि", json_url: "DATA/10th/hindi/ch5.json" },
            { id: 6, name: "6. बहादुर", json_url: "DATA/10th/hindi/ch6.json" },
            { id: 7, name: "7. परम्परा का मूल्यांकन", json_url: "DATA/10th/hindi/ch7.json" },
            { id: 8, name: "8. जित-जित मैं निरखत हूँ", json_url: "DATA/10th/hindi/ch8.json" },
            { id: 9, name: "9. आविन्यों", json_url: "DATA/10th/hindi/ch9.json" },
            { id: 10, name: "10. मछली", json_url: "DATA/10th/hindi/ch10.json" },
            { id: 11, name: "11. नौबतखाने में इबादत", json_url: null },
            { id: 12, name: "12. शिक्षा और संस्कृति", json_url: null }
        ]
    },
    {
        id: "math",
        name: "गणित (Mathematics)",
        subtext: "वास्तविक संख्याएँ, त्रिकोणमिति आदि",
        icon: "calculator",
        theme: "from-emerald-600 to-teal-700",
        border: "border-emerald-200",
        chapters: []
    },
    {
        id: "sst",
        name: "सामाजिक विज्ञान (Social Science)",
        subtext: "इतिहास, भूगोल, राजनीति, अर्थशास्त्र",
        icon: "globe",
        theme: "from-amber-600 to-orange-700",
        border: "border-amber-200",
        chapters: []
    },
    {
        id: "sanskrit",
        name: "संस्कृत (Sanskrit - पीयूषम)",
        subtext: "मंगलम्, पाटलिपुत्रवैभवम् आदि",
        icon: "scroll",
        theme: "from-purple-600 to-indigo-800",
        border: "border-purple-200",
        chapters: []
    },
    {
        id: "english",
        name: "अंग्रेजी (English - Panorama)",
        subtext: "Prose & Poetry Section",
        icon: "languages",
        theme: "from-cyan-600 to-blue-700",
        border: "border-cyan-200",
        chapters: []
    }
];

function openPYQSubjectsPortal() {
    let subjectsHTML = PYQ_MASTER_SUBJECTS.map((sub) => {
        return `
        <button onclick="handlePYQSubjectClick('${sub.id}')" class="w-full text-left bg-white hover:bg-rose-50/50 p-4 rounded-2xl border ${sub.border} shadow-sm active:scale-98 transition-all flex items-center justify-between group cursor-pointer">
            <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${sub.theme} text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                    <i data-lucide="${sub.icon}" class="w-5 h-5"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-900 group-hover:text-crimson transition-colors">${sub.name}</h4>
                    <p class="text-[11px] text-slate-500 font-medium mt-0.5">${sub.subtext}</p>
                </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-crimson group-hover:translate-x-0.5 transition-all"></i>
        </button>`;
    }).join("");

    const pageHTML = `
        <div class="bg-gradient-to-r from-crimson via-rose-800 to-rose-900 text-white p-4 rounded-2xl shadow-md space-y-1 mb-3">
            <span class="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">BSEB Class 10th Special</span>
            <h2 class="text-base font-black">पिछले वर्षों के प्रश्न (PYQ Chapter Wise)</h2>
            <p class="text-[11px] text-rose-100 font-medium">प्रैक्टिस करने के लिए अपना पसंदीदा विषय चुनें:</p>
        </div>
        <div class="space-y-2.5">${subjectsHTML}</div>`;

    openDynamicPage("PYQ Subjects", pageHTML, true);
}

window.handlePYQSubjectClick = function(subjectId) {
    const subject = PYQ_MASTER_SUBJECTS.find(s => s.id === subjectId);
    if (!subject) return;

    if (!subject.chapters || subject.chapters.length === 0) {
        showPYQSubjectPendingWarning(subject.name);
        return;
    }

    renderPYQChaptersList(subject);
};

function showPYQSubjectPendingWarning(subjectName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <i data-lucide="alert-triangle" class="w-8 h-8"></i>
            </div>
            <div>
                <span class="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase">Under Preparation</span>
                <h2 class="text-base font-black text-slate-900 mt-2">${subjectName}</h2>
            </div>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left space-y-1">
                <p class="text-xs font-black text-amber-900 flex items-center space-x-1.5">
                    <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
                    <span>जल्द ही अपलोड की जाएगी!</span>
                </p>
                <p class="text-[11px] text-slate-600 font-medium">
                    इस विषय के पिछले वर्षों के सभी महत्वपूर्ण प्रश्नों (PYQs) को तैयार किया जा रहा है। बहुत जल्द यह विद्यार्थियों के लिए उपलब्ध होगा।
                </p>
            </div>
            <button onclick="goBackModalStep()" class="w-full bg-crimson hover:bg-rose-900 text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform cursor-pointer">
                ← वापस विषयों की सूची पर जाएँ
            </button>
        </div>`;
    openDynamicPage("सूचना (Notification)", htmlContent);
}

function renderPYQChaptersList(subject) {
    let chaptersHTML = subject.chapters.map((chap, idx) => {
        const isReady = chap.json_url !== null && chap.json_url !== "";
        return `
        <button onclick="${isReady ? `loadPYQQuizJSON('${chap.json_url}', '${chap.name}')` : `showPYQChapterPendingWarning('${chap.name}')`}" 
                class="w-full text-left bg-white hover:bg-rose-50/50 p-4 rounded-2xl border border-slate-200 hover:border-crimson shadow-xs active:scale-98 transition-all flex items-center justify-between group cursor-pointer">
            <div class="flex items-center space-x-3.5">
                <div class="w-8 h-8 rounded-xl bg-rose-100 text-crimson font-black text-xs flex items-center justify-center flex-none">
                    ${idx + 1}
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-900 group-hover:text-crimson leading-snug">${chap.name}</h4>
                </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-crimson group-hover:translate-x-0.5 transition-transform flex-none ml-2"></i>
        </button>`;
    }).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-rose-100 text-crimson text-[10px] font-black px-2.5 py-0.5 rounded-full">${subject.name}</span>
            <h2 class="text-base font-black text-slate-900">अध्याय सूची (Chapter List)</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रश्नों का अभ्यास करने के लिए किसी भी अध्याय पर क्लिक करें:</p>
        </div>
        <div class="space-y-2.5 pb-6">${chaptersHTML}</div>`;

    openDynamicPage(`${subject.name} - Chapters`, pageHTML);
}

function showPYQChapterPendingWarning(chapName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <h2 class="text-base font-black text-slate-900">${chapName}</h2>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p class="text-xs font-bold text-amber-900">इस अध्याय का PYQ जल्द ही अपलोड किया जाएगा!</p>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">हमारी टीम पिछले वर्षों के प्रश्नों का विश्लेषण कर रही है, बहुत जल्द यह उपलब्ध होगा।</p>
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform cursor-pointer">
                ← वापस अध्याय सूची पर जाएँ
            </button>
        </div>`;
    openDynamicPage("शीघ्र उपलब्ध", htmlContent);
}

window.loadPYQQuizJSON = async function(jsonUrl, chapterTitle) {
    try {
        const fetchUrl = jsonUrl + "?v=" + APP_VERSION;
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("JSON Fetch Failed");
        const questions = await res.json();

        currentPracticeData = questions;
        currentPracticeTitle = chapterTitle;
        currentPracticeAnswers = new Array(questions.length).fill(null);

        renderPYQQuizUI(false);
    } catch (e) {
        showToast("यह चैप्टर फ़ाइल लोड नहीं हो सकी।");
        console.error("PYQ Quiz Load Error:", e);
    }
};

function renderPYQQuizUI(isUpdate = false) {
    let questionsHTML = currentPracticeData.map((q, qIdx) => {
        const selectedOpt = currentPracticeAnswers[qIdx];
        const isAnswered = selectedOpt !== null;

        let optionsList = [];
        let correctAnswerKey = "";

        if (Array.isArray(q.options)) {
            optionsList = q.options;
            correctAnswerKey = q.answer;
        } else if (typeof q.options === 'object') {
            optionsList = Object.entries(q.options);
            correctAnswerKey = q.correct_answer;
        }

        let yearsBadgeHTML = "";
        if (q.years && Array.isArray(q.years) && q.years.length > 0) {
            yearsBadgeHTML = `
                <div class="flex items-center space-x-1">
                    <span class="text-[10px] sm:text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <i data-lucide="history" class="w-3.5 h-3.5"></i>
                        <span>BSEB ${q.years.join(', ')}</span>
                    </span>
                </div>`;
        }

        let optionsHTML = optionsList.map(([key, optText]) => {
            let btnStyle = "bg-white border-slate-200 text-slate-800 hover:bg-slate-50";

            if (isAnswered) {
                if (key.toLowerCase() === correctAnswerKey.toLowerCase()) {
                    btnStyle = "bg-emerald-100 border-emerald-600 text-emerald-900 font-black ring-2 ring-emerald-500";
                } else if (selectedOpt === key) {
                    btnStyle = "bg-rose-100 border-rose-600 text-rose-900 font-bold ring-2 ring-rose-500";
                } else {
                    btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                }
            }

            return `
                <button onclick="handlePYQOptionSelect(${qIdx}, '${key}')" ${isAnswered ? 'disabled' : ''} class="w-full text-left p-3.5 rounded-xl border text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer ${btnStyle}">
                    <span>(${key.toUpperCase()}) ${optText}</span>${isAnswered && key.toLowerCase() === correctAnswerKey.toLowerCase() ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-none"></i>' : ''}
                    ${isAnswered && selectedOpt === key && key.toLowerCase() !== correctAnswerKey.toLowerCase() ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-600 flex-none"></i>' : ''}
                </button>`;
        }).join('');

        let explanationHTML = "";
        if (isAnswered) {
            const isCorrect = selectedOpt.toLowerCase() === correctAnswerKey.toLowerCase();
            explanationHTML = `
                <div class="mt-3 p-4 rounded-2xl ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'} space-y-1.5 animate-fadeIn">
                    <div class="flex items-center space-x-1.5 text-xs sm:text-sm font-black ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}">
                        <i data-lucide="${isCorrect ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
                        <span>${isCorrect ? 'सही उत्तर!' : `गलत उत्तर! सही विकल्प (${correctAnswerKey.toUpperCase()}) है।`}</span>
                    </div>
                    <p class="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed pt-1">
                        <span class="font-bold text-slate-900">व्याख्या:</span> ${q.explanation || "व्याख्या उपलब्ध नहीं है।"}
                    </p>
                </div>`;
        }

        return `
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 mb-4">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span class="bg-rose-50 text-crimson text-xs font-black px-2.5 py-0.5 rounded-md">प्रश्न संख्या ${qIdx + 1}</span>${yearsBadgeHTML}
                </div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">${q.question}</h3>
                <div class="space-y-2.5 pt-1">${optionsHTML}</div>${explanationHTML}
            </div>`;
    }).join('');

    const pageContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3 sticky top-0 z-10">
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">PYQ Chapter Wise Practice</span>
            <h2 class="text-base font-black text-slate-900">${currentPracticeTitle}</h2>
        </div>
        <div class="pb-6">${questionsHTML}</div>`;

    openDynamicPage("PYQ Test", pageContent, false, isUpdate);
}

window.handlePYQOptionSelect = function(qIdx, optKey) {
    currentPracticeAnswers[qIdx] = optKey;
    renderPYQQuizUI(true);
};


// ==========================================================================
// SECTION 9: 🟢 BILINGUAL AUTH, PROFILE & ORDERS ENGINE (VALIDATED & ATTRACTIVE)
// ==========================================================================

let currentStudentProfile = {
    name: "रौशन कुमार / Raushan Kumar",
    fatherName: "श्री राम प्रवेश / Ram Pravesh",
    mobile: "9128919447",
    fatherMobile: "9876543210",
    schoolName: "उच्च माध्यमिक विद्यालय / High School",
    village: "बेगूसराय / Begusarai",
    district: "बेगूसराय / Begusarai",
    pincode: "851101",
    studentClass: "10"
};

// 1. Name validation helper: Only letters, space and dot (.) allowed
window.validateNameInput = function(input) {
    input.value = input.value.replace(/[0-9*#@/\\!$%^&()+=\-_<>;:?[\]{}~`"|]/g, '');
};

// 2. Mobile validation helper: 10 digits & blocks starting with 1,2,3,4,5
window.validateMobileInput = function(input) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    
    const errorElem = document.getElementById("mobile-validation-msg");
    if (input.value.length > 0) {
        const firstDigit = input.value[0];
        if (['1', '2', '3', '4', '5'].includes(firstDigit)) {
            if (errorElem) {
                errorElem.innerText = "कृपया सही मोबाइल नंबर दें (नंबर 6, 7, 8 या 9 से शुरू होना चाहिए)";
                errorElem.classList.remove("hidden");
            }
        } else {
            if (errorElem) errorElem.classList.add("hidden");
        }
    } else {
        if (errorElem) errorElem.classList.add("hidden");
    }
};

// 3. 4-Digit Password PIN validator
window.validateFourDigitPin = function(input) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4);
};

// 4. Attractive & Colorful Sign-up Modal
window.openStudentSignupModal = function() {
    const htmlContent = `
        <div class="bg-gradient-to-b from-white via-rose-50/30 to-creamBg p-4 sm:p-6 rounded-3xl border border-rose-100 shadow-xl space-y-4 max-w-md mx-auto">
            
            <!-- Header Card -->
            <div class="relative overflow-hidden bg-gradient-to-r from-crimson via-rose-800 to-rose-900 text-white p-4 rounded-2xl shadow-md text-center">
                <div class="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <span class="inline-block bg-white/20 backdrop-blur-md text-amber-200 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-1 border border-white/20">
                    ★ नया पंजीकरण / New Registration ★
                </span>
                <h2 class="text-lg sm:text-xl font-black tracking-tight leading-tight">नया ID बनाएँ</h2>
            </div>

            <form id="signup-form" onsubmit="handleSignupSubmit(event)" class="space-y-4 text-left">
                
                <!-- 🟢 Section A: Mandatory Info (Only 4 fields) -->
                <div class="bg-white p-4 rounded-2xl border-2 border-rose-100 shadow-xs space-y-3.5">
                    <div class="flex items-center space-x-1.5 pb-1 border-b border-rose-100/60">
                        <i data-lucide="sparkles" class="w-4 h-4 text-rose-600"></i>
                        <span class="text-xs font-black text-rose-900 uppercase tracking-wider">जरूरी जानकारी (Mandatory)</span>
                    </div>

                    <!-- 1. Name -->
                    <div>
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">
                            नाम (Name) <span class="text-rose-600">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
                                <i data-lucide="user" class="w-4 h-4"></i>
                            </span>
                            <input type="text" id="reg-name" required placeholder="अपना पूरा नाम लिखें" 
                                   oninput="validateNameInput(this)"
                                   class="w-full text-xs font-bold pl-9 pr-3 py-3 rounded-xl border border-rose-200/80 bg-rose-50/20 focus:bg-white focus:border-crimson focus:ring-2 focus:ring-rose-200 outline-none transition-all">
                        </div>
                    </div>

                    <!-- 2. Mobile No -->
                    <div>
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">
                            मोबाइल नंबर (Mobile No.) <span class="text-rose-600">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 font-black text-xs">
                                +91
                            </span>
                            <input type="tel" id="reg-mobile" maxlength="10" required placeholder="10 अंकों का मोबाइल नंबर" 
                                   oninput="validateMobileInput(this)"
                                   class="w-full text-xs font-bold pl-11 pr-3 py-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                        </div>
                        <p id="mobile-validation-msg" class="text-[10px] text-rose-600 font-bold mt-1 hidden"></p>
                    </div>

                    <!-- 3. Class (4 options) & 4-Digit Password PIN -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        <div>
                            <label class="block text-xs font-extrabold text-slate-800 mb-1">
                                वर्ग (Class) <span class="text-rose-600">*</span>
                            </label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                                </span>
                                <select id="reg-class" required class="w-full text-xs font-bold pl-9 pr-3 py-3 rounded-xl border border-sky-200 bg-sky-50/20 focus:bg-white focus:border-accentBlue focus:ring-2 focus:ring-sky-200 outline-none transition-all">
                                    <option value="10"> 10th</option>
                                    <option value="9">9th</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-extrabold text-slate-800 mb-1">
                                4-अंक पासवर्ड (PIN) <span class="text-rose-600">*</span>
                            </label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                                    <i data-lucide="lock" class="w-4 h-4"></i>
                                </span>
                                <input type="password" id="reg-password" inputmode="numeric" maxlength="4" required 
                                       placeholder="••••" 
                                       oninput="validateFourDigitPin(this)"
                                       class="w-full text-sm font-black pl-9 pr-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50/20 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-center tracking-widest transition-all">
                            </div>
                            <span class="text-[9px] text-slate-400 block mt-0.5 text-center">लॉगिन के लिए  4 अंकों का नया  पिन set करे  </span>
                        </div>
                    </div>
                </div>

                <!-- 🟢 Section B: Optional Details -->
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span class="text-xs font-bold text-slate-600 flex items-center space-x-1">
                            <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i>
                            <span>अन्य विवरण (Optional)</span>
                        </span>
                        <span class="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md"></span>
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">पिता का नाम (Father's Name)</label>
                        <input type="text" id="reg-father" placeholder="पिताजी का नाम" 
                               oninput="validateNameInput(this)"
                               class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all">
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">विद्यालय या कोचिंग का नाम</label>
                        <input type="text" id="reg-school" placeholder="संस्था का नाम" 
                               class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all">
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-slate-700 mb-1">अभिभावक का मोबाइल नंबर</label>
                        <input type="tel" id="reg-father-mobile" maxlength="10" placeholder="10 अंकों का संपर्क नंबर" 
                               oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);"
                               class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">गाँव </label>
                            <input type="text" id="reg-village" placeholder="गाँव/शहर" 
                                   class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">ज़िला</label>
                            <input type="text" id="reg-district" placeholder="ज़िला" 
                                   class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">पिन कोड</label>
                            <input type="text" id="reg-pincode" maxlength="6" placeholder="पिन कोड" 
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);"
                                   class="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none">
                        </div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-1">
                    <button type="submit" class="w-full bg-gradient-to-r from-crimson via-rose-700 to-softPink hover:from-rose-800 hover:to-crimson text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-rose-300/60 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-rose-400/30">
                        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                        <span class="tracking-wide">रजिस्टर करें (Register Now)</span>
                    </button>
                </div>
            </form>
        </div>`;
    openDynamicPage("नया ID बनाएँ", htmlContent);
};

// 🟢 LIVE SUPABASE INSERT WITH ERROR & DUPLICATE CHECKS
window.handleSignupSubmit = async function(e) {
    e.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const mobile = document.getElementById("reg-mobile").value.trim();
    const pin = document.getElementById("reg-password").value.trim();
    const studentClass = document.getElementById("reg-class").value;

    // 1. क्लाइंट-साइड वैलिडेशन
    if (!name || name.length < 2) {
        showToast("कृपया सही नाम दर्ज करें!");
        return;
    }
    if (mobile.length !== 10 || ['1','2','3','4','5'].includes(mobile[0])) {
        showToast("कृपया सही 10 अंकों का मोबाइल नंबर दें!");
        return;
    }
    if (pin.length !== 4) {
        showToast("कृपया ठीक 4 अंकों का पासवर्ड (PIN) सेट करें!");
        return;
    }

    // 2. सबमिट बटन को लोडिंग स्टेट में डालें (ताकि डबल क्लिक न हो)
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>कृपया प्रतीक्षा करें...</span>`;
    }

    const newStudent = {
        mobile: mobile,
        name: name,
        student_class: studentClass,
        pin: pin,
        father_name: document.getElementById("reg-father")?.value.trim() || null,
        school_name: document.getElementById("reg-school")?.value.trim() || null,
        father_mobile: document.getElementById("reg-father-mobile")?.value.trim() || null,
        village: document.getElementById("reg-village")?.value.trim() || null,
        district: document.getElementById("reg-district")?.value.trim() || null,
        pincode: document.getElementById("reg-pincode")?.value.trim() || null
    };

    try {
        // 3. Supabase में Insert कॉल
        const { data, error } = await supabaseClient
            .from('students')
            .insert([newStudent]);

        // 4. अगर डेटाबेस से कोई एरर आया
        if (error) {
            console.error("Supabase Error Details:", error);

            // एरर कोड 23505 = Primary Key / Unique Violation (नंबर पहले से मौजूद है)
            if (error.code === '23505') {
                showToast("यह मोबाइल नंबर पहले से रजिस्टर्ड है! कृपया सीधे लॉगिन करें।");
            } else {
                showToast("रजिस्ट्रेशन नहीं हो सका: " + (error.message || "डेटाबेस एरर"));
            }

            // बटन को वापस सामान्य करें
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return; // यहीं रुक जाएँ, आगे बधाई वाला कोड नहीं चलेगा
        }

        // 5. केवल तभी चलेगा जब डेटाबेस में इंसर्ट 100% सफल हो गया हो
        console.log("डेटाबेस में सफलतापूर्वक डेटा सेव हुआ:", newStudent);

        currentStudentProfile = newStudent;
        localStorage.setItem("current_student", JSON.stringify(newStudent));

       // 1. नाम अपडेट करें
let sidebarName = document.getElementById("sidebar-user-name");
if (sidebarName && currentStudentProfile.name) {
    sidebarName.innerText = currentStudentProfile.name;
}

// 2. नीचे क्लास अपडेट करें
let sidebarClass = document.getElementById("sidebar-user-class");
let studentCls = currentStudentProfile.student_class || currentStudentProfile.studentClass;

if (sidebarClass && studentCls) {
    if (studentCls === "10" || studentCls === "9") {
        sidebarClass.innerText = ` (Class ${studentCls}th)`;
    } else {
        sidebarClass.innerText = `${studentCls}`;
    }
}

        showToast("🎉 बधाई हो! आपका रजिस्ट्रेशन सफलतापूर्वक हो गया।");
        openStudentLoginModal();

    } catch (err) {
        console.error("नेटवर्क या अप्रत्याशित एरर:", err);
        showToast("इंटरनेट कनेक्शन या सर्वर में समस्या आई!");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
};
// 6.// ==========================================================================
// 🟢 मोडल खोलने वाला फ़ंक्शन (POPUP OPENER)
// ==========================================================================
window.openStudentLoginModal = function(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }

    const htmlContent = `
        <div class="bg-gradient-to-b from-white via-rose-50/30 to-creamBg p-4 sm:p-6 rounded-3xl border border-rose-100 shadow-xl space-y-4 max-w-md mx-auto">
            
            <!-- Header Card -->
            <div class="relative overflow-hidden bg-gradient-to-r from-crimson via-rose-800 to-rose-900 text-white p-4 rounded-2xl shadow-md text-center">
                <div class="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <span class="inline-block bg-white/20 backdrop-blur-md text-amber-200 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-1 border border-white/20">
                    ★ छात्र लॉगिन / Student Login ★
                </span>
                <h2 class="text-lg sm:text-xl font-black tracking-tight leading-tight">लॉगिन करें</h2>
            </div>

            <!-- Login Form -->
            <form id="student-login-form" onsubmit="window.handleLoginSubmit(event)" class="space-y-4 text-left">
                <div class="bg-white p-4 rounded-2xl border-2 border-rose-100 shadow-xs space-y-3.5">
                    
                    <!-- Mobile Number Field -->
                    <div>
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">
                            रजिस्टर्ड मोबाइल नंबर <span class="text-rose-600">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 font-black text-xs">
                                +91
                            </span>
                            <input type="tel" id="login-mobile" maxlength="10" required placeholder="10 अंकों का रजिस्टर्ड मोबाइल" 
                                   oninput="validateMobileInput(this)"
                                   class="w-full text-xs font-bold pl-11 pr-3 py-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none transition-all">
                        </div>
                    </div>

                    <!-- 4-Digit Password PIN Field -->
                    <div>
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">
                            4-अंक पासवर्ड (PIN) <span class="text-rose-600">*</span>
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500 text-xs">
                                <i class="fa-solid fa-lock"></i>
                            </span>
                            <input type="password" id="login-pin" inputmode="numeric" maxlength="4" required 
                                   placeholder="••••" 
                                   oninput="validateFourDigitPin(this)"
                                   class="w-full text-sm font-black pl-9 pr-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50/20 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-center tracking-widest transition-all">
                        </div>
                    </div>

                </div>

                <!-- Submit Button -->
                <div class="pt-1">
                    <button type="submit" class="w-full bg-gradient-to-r from-crimson via-rose-700 to-softPink hover:from-rose-800 hover:to-crimson text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-rose-300/60 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-rose-400/30">
                        <i class="fa-solid fa-right-to-bracket"></i>
                        <span class="tracking-wide">लॉगिन करें (Login)</span>
                    </button>
                </div>
            </form>

            <!-- Switch to Signup -->
            <div class="text-center pt-2 border-t border-rose-100">
                <p class="text-xs text-slate-500 font-medium">अभी तक अकाउंट नहीं बनाया?</p>
                <button type="button" onclick="window.openStudentSignupModal()" class="text-xs text-crimson font-black hover:underline mt-1 cursor-pointer">
                    यहाँ नया ID (रजिस्ट्रेशन) बनाएँ →
                </button>
            </div>

        </div>`;

    // Direct arguments pass kiye gaye: Pehla title, doosra HTML string
    openDynamicPage("छात्र लॉगिन", htmlContent);
};
// ==========================================================================
// 2. 🟢 Supabase लॉगिन सत्यापन फ़ंक्शन (SUBMIT HANDLER)
// ==========================================================================
window.handleLoginSubmit = async function(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }

    const mobileInput = document.getElementById("login-mobile");
    const pinInput = document.getElementById("login-pin");

    const mobile = mobileInput ? mobileInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    // 1. बेसिक इनपुट चेक
    if (mobile.length !== 10) {
        showToast("कृपया 10 अंकों का रजिस्टर्ड मोबाइल नंबर दें!");
        return;
    }
    if (pin.length !== 4) {
        showToast("कृपया ठीक 4 अंकों का पासवर्ड पिन दर्ज करें!");
        return;
    }

    // 2. सबमिट बटन लोडिंग स्टेट
    const submitBtn = e && e.target ? e.target.querySelector('button[type="submit"]') : null;
    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>जाँच हो रही है...</span>`;
    }

    try {
        // 3. Supabase से छात्र का डेटा खोजें
        const { data: student, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('mobile', mobile)
            .maybeSingle();

        if (error) {
            console.error("Supabase Login Error:", error);
            showToast("सर्वर एरर: कृपया कुछ देर बाद प्रयास करें!");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        // 4. अगर मोबाइल नंबर डेटाबेस में न मिले
        if (!student) {
            showToast("यह मोबाइल नंबर रजिस्टर्ड नहीं है! कृपया पहले नया ID बनाएँ।");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        // 5. पिन (पासवर्ड) का मिलान
        if (String(student.pin) !== String(pin)) {
            showToast("❌ गलत पासवर्ड (पिन)! कृपया सही पिन डालें।");
            if (pinInput) {
                pinInput.value = "";
                pinInput.focus();
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            return;
        }

        // 6. लॉगिन सफल होने पर
        console.log("✅ लॉगिन सफल रहा:", student.name);

        currentStudentProfile = student;
        localStorage.setItem("current_student", JSON.stringify(student));

        // 1. नाम अपडेट करें
let sidebarName = document.getElementById("sidebar-user-name");
if (sidebarName && currentStudentProfile.name) {
    sidebarName.innerText = currentStudentProfile.name;
}

// 2. नीचे क्लास अपडेट करें
let sidebarClass = document.getElementById("sidebar-user-class");
let studentCls = currentStudentProfile.student_class || currentStudentProfile.studentClass;

if (sidebarClass && studentCls) {
    if (studentCls === "10" || studentCls === "9") {
        sidebarClass.innerText = ` (Class ${studentCls}th)`;
    } else {
        sidebarClass.innerText = `${studentCls}`;
    }
}

    window.applyStudentAuthToUI();
        showToast("🎉 स्वागत है, " + student.name + "! लॉगिन सफल रहा।");

        // 7. मोडल बंद करके होम पेज पर स्क्रॉल करें
        if (typeof closeDynamicPage === 'function') closeDynamicPage();
        if (typeof window.closeSideMenuDirect === 'function') window.closeSideMenuDirect();
        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
        console.error("Login Unexpected Error:", err);
        showToast("कनेक्शन में समस्या आई!");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
};

// 7. Profile Edit Modal (Mobile Number Locked)
window.openStudentProfileEditModal = function() {
    const htmlContent = `
        <div class="bg-white p-5 rounded-3xl border border-rose-100 shadow-md space-y-4">
            <div class="border-b border-rose-100 pb-3 text-center">
                <span class="bg-sky-100 text-accentBlue text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">प्रोफ़ाइल संपादन / Edit Profile</span>
                <h2 class="text-lg font-black text-slate-900 mt-1.5 leading-tight">प्रोफ़ाइल एडिट करें</h2>
                <p class="text-xs text-slate-500 font-medium">Update Information (Mobile number cannot be changed)</p>
            </div>

            <form id="edit-profile-form" onsubmit="handleProfileEditSubmit(event)" class="space-y-3.5 text-left">
                <div>
                    <label class="block text-xs font-black text-slate-800 mb-1">विद्यार्थी का नाम / Student Name</label>
                    <input type="text" id="edit-name" value="${currentStudentProfile.name}" required 
                           oninput="validateNameInput(this)"
                           class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                </div>

                <div>
                    <label class="block text-xs font-black text-slate-800 mb-1">पिता का नाम / Father's Name</label>
                    <input type="text" id="edit-father" value="${currentStudentProfile.fatherName}" 
                           oninput="validateNameInput(this)"
                           class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="text-xs font-black text-slate-800">मोबाइल नंबर / Mobile Number</label>
                        <span class="text-[10px] text-rose-500 font-bold flex items-center space-x-1">
                            <i data-lucide="lock" class="w-3 h-3"></i>
                            <span>बदला नहीं जा सकता / Locked</span>
                        </span>
                    </div>
                    <input type="text" id="edit-mobile" value="${currentStudentProfile.mobile}" readonly disabled 
                           class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none select-none">
                </div>

                <div>
                    <label class="block text-xs font-black text-slate-800 mb-1">पिता का मोबाइल / Father's Contact</label>
                    <input type="tel" id="edit-father-mobile" maxlength="10" value="${currentStudentProfile.fatherMobile || ''}" 
                           oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);"
                           class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                </div>

                <div>
                    <label class="block text-xs font-black text-slate-800 mb-1">स्कूल का नाम / School Name</label>
                    <input type="text" id="edit-school" value="${currentStudentProfile.schoolName}" 
                           class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-black text-slate-800 mb-1">गाँव / Village</label>
                        <input type="text" id="edit-village" value="${currentStudentProfile.village}" 
                               class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-black text-slate-800 mb-1">ज़िला / District</label>
                        <input type="text" id="edit-district" value="${currentStudentProfile.district}" 
                               class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-black text-slate-800 mb-1">पिन कोड / PIN</label>
                        <input type="text" id="edit-pincode" maxlength="6" value="${currentStudentProfile.pincode}" 
                               oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);"
                               class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson outline-none">
                    </div>
                </div>

                <!-- 4 Options Class/Role in Profile Edit as well -->
                <div>
                    <label class="block text-xs font-black text-slate-800 mb-1">वर्ग / श्रेणी (Class / Role)</label>
                    <select id="edit-class" class="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 focus:border-crimson bg-white outline-none">
                        <option value="10" ${currentStudentProfile.studentClass === '10' ? 'selected' : ''}>कक्षा 10वीं (Class 10th)</option>
                        <option value="9" ${currentStudentProfile.studentClass === '9' ? 'selected' : ''}>कक्षा 9वीं (Class 9th)</option>
                        <option value="teacher" ${currentStudentProfile.studentClass === 'teacher' ? 'selected' : ''}>शिक्षक (Teacher)</option>
                        <option value="other" ${currentStudentProfile.studentClass === 'other' ? 'selected' : ''}>अन्य वर्ग (Other)</option>
                    </select>
                </div>

                <div class="pt-3">
                    <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                        <i data-lucide="save" class="w-4 h-4"></i>
                        <span>अपडेट सुरक्षित करें / Save Changes</span>
                    </button>
                </div>
            </form>
        </div>`;
    openDynamicPage("प्रोफ़ाइल एडिट (Edit Profile)", htmlContent);
};

window.handleProfileEditSubmit = function(e) {
    e.preventDefault();
    currentStudentProfile.name = document.getElementById("edit-name").value.trim();
    currentStudentProfile.fatherName = document.getElementById("edit-father").value.trim();
    currentStudentProfile.fatherMobile = document.getElementById("edit-father-mobile").value.trim();
    currentStudentProfile.schoolName = document.getElementById("edit-school").value.trim();
    currentStudentProfile.village = document.getElementById("edit-village").value.trim();
    currentStudentProfile.district = document.getElementById("edit-district").value.trim();
    currentStudentProfile.pincode = document.getElementById("edit-pincode").value.trim();
    currentStudentProfile.studentClass = document.getElementById("edit-class").value;

    let sidebarName = document.getElementById("sidebar-user-name");
    let sidebarClass = document.getElementById("sidebar-user-class");

    if (sidebarName) sidebarName.innerText = currentStudentProfile.name;
    if (sidebarClass) sidebarClass.innerText =`Class-` +currentStudentProfile.studentClass;

    showToast("प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!");
    goBackModalStep();
};

// 8. Mere Orders (My Orders) Modal
window.openMyOrdersModal = function() {
    const mockOrders = [
        
    ];

    let ordersListHTML = "";
    if (mockOrders.length === 0) {
        ordersListHTML = `
            <div class="p-8 text-center space-y-2">
                <i data-lucide="package-open" class="w-12 h-12 text-slate-300 mx-auto"></i>
                <p class="text-xs font-bold text-slate-600">कोई ऑर्डर उपलब्ध नहीं है / No Orders Found</p>
            </div>`;
    } else {
        ordersListHTML = mockOrders.map(order => `
            <div class="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 text-left">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span class="text-xs font-black text-slate-900">${order.orderId}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${order.statusColor}">${order.status}</span>
                </div>
                <div class="text-xs font-bold text-slate-800">${order.bookName}</div>
                <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                    <span>मूल्य / Price: <strong class="text-slate-800">${order.price}</strong></span>
                    <span>तारीख / Date: ${order.date}</span>
                </div>
            </div>`).join("");
    }

    const htmlContent = `
        <div class="bg-white p-5 rounded-3xl border border-rose-100 shadow-md space-y-4">
            <div class="border-b border-rose-100 pb-3 text-center">
                <span class="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">ऑर्डर हिस्ट्री / Order History</span>
                <h2 class="text-lg font-black text-slate-900 mt-1.5 leading-tight">मेरे ऑर्डर्स</h2>
                <p class="text-xs text-slate-500 font-medium">My Orders & Tracking</p>
            </div>
            
            <div class="space-y-3">
                ${ordersListHTML}
            </div>

            <div class="pt-2">
                <button onclick="goBackModalStep()" class="w-full bg-crimson hover:bg-rose-900 text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform cursor-pointer">
                    ← Back
                </button>
            </div>
        </div>`;

    openDynamicPage("मेरे ऑर्डर्स (My Orders)", htmlContent);
};

// ==========================================================================
// 🟢 सहायता एवं संपर्क (HELP & SUPPORT - STYLISH & COLORFUL MODAL)
// ==========================================================================
window.redirectToHelpSupport = function() {
    window.closeSideMenuDirect(); // साइडबार बंद करेगा

    const supportHtml = `
        <div class="max-w-md mx-auto space-y-4 text-left">
            
            <!-- 1. Header Hero Card -->
            <div class="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-5 rounded-3xl shadow-xl text-center border border-emerald-400/20">
                <div class="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div class="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>

                <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner border border-white/20">
                    <i class="fa-solid fa-headset text-emerald-300"></i>
                </div>

                <span class="inline-block bg-white/20 text-emerald-100 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-1.5 border border-white/20">
                    ★ 24x7 विद्यार्थी सहायता केंद्र ★
                </span>
                <h3 class="text-xl font-black tracking-tight leading-tight">सहायता एवं संपर्क</h3>
                <p class="text-xs text-emerald-100 mt-1">किताब ऑर्डर, टेस्ट सीरीज या पढ़ाई से जुड़े किसी भी सवाल के लिए संपर्क करें</p>
            </div>

            <!-- 2. Direct One-Tap Contact Grid -->
            <div class="grid grid-cols-2 gap-3">
                
                <!-- Direct Call -->
                <a href="tel:+919128919447" 
                   class="bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center space-x-3 transition-transform active:scale-95 group">
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base flex-none group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <i class="fa-solid fa-phone-volume"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-slate-800">डायरेक्ट कॉल</p>
                        <p class="text-[10px] text-emerald-600 font-bold">+91 9128919447</p>
                    </div>
                </a>

                <!-- WhatsApp Direct -->
                <a href="https://wa.me/919128919447?text=नमस्ते%20राज%20सर,%20मुझे%20सहायता%20चाहिए।" target="_blank"
                   class="bg-white hover:bg-green-50/50 p-3.5 rounded-2xl border border-green-200 shadow-xs flex items-center space-x-3 transition-transform active:scale-95 group">
                    <div class="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-base flex-none group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <i class="fa-brands fa-whatsapp"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-slate-800">व्हाट्सएप चैट</p>
                        <p class="text-[10px] text-green-600 font-bold">तुरंत उत्तर पाएँ</p>
                    </div>
                </a>

                <!-- Official Email -->
                <a href="mailto:selfstudybookofficials.com?subject=SelfStudyBook%20Student%20Inquiry"
                   class="bg-white hover:bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200 shadow-xs flex items-center space-x-3 transition-transform active:scale-95 group">
                    <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base flex-none group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-slate-800">ईमेल सपोर्ट</p>
                        <p class="text-[10px] text-rose-600 font-bold">Mail Us</p>
                    </div>
                </a>

                <!-- Telegram Group -->
                <a href="https://t.me/selfstudybook" target="SelfStudyBook"
                   class="bg-white hover:bg-sky-50/50 p-3.5 rounded-2xl border border-sky-200 shadow-xs flex items-center space-x-3 transition-transform active:scale-95 group">
                    <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-base flex-none group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <i class="fa-brands fa-telegram"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black text-slate-800">टेलीग्राम चैनल</p>
                        <p class="text-[10px] text-sky-600 font-bold">Free PDF ग्रुप</p>
                    </div>
                </a>

            </div>

            <!-- 3. Office & Timing Info Box -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
                <div class="flex items-center space-x-2 text-slate-900 font-black pb-1.5 border-b border-slate-100">
                    <i class="fa-solid fa-clock text-amber-500"></i>
                    <span>सपोर्ट का समय और कार्यालय</span>
                </div>
                
                <div class="flex justify-between items-center text-slate-600 font-medium">
                    <span>कॉल एवं सहायता समय:</span>
                    <strong class="text-slate-800 font-bold">सुबह 08:00 AM से रात 08:00 PM</strong>
                </div>

                <div class="flex justify-between items-center text-slate-600 font-medium">
                    <span>व्हाट्सएप संदेश:</span>
                    <strong class="text-emerald-600 font-bold">24x7 एक्टिव (कभी भी भेजें)</strong>
                </div>

                <div class="flex items-start space-x-2 text-slate-600 font-medium pt-1 border-t border-slate-100">
                    <i class="fa-solid fa-location-dot text-rose-500 mt-0.5"></i>
                    <span>SelfStudyBook Publication, पटना / बेगूसराय, बिहार (भारत)</span>
                </div>
            </div>

            <!-- 4. Frequently Asked Questions (Quick FAQ Accordion) -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 class="text-xs font-black text-slate-900 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <i class="fa-solid fa-circle-question text-teal-600"></i>
                    <span>अक्सर पूछे जाने वाले सवाल (FAQs)</span>
                </h4>

                <div class="space-y-2 text-xs">
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p class="font-bold text-slate-800">Q1. क्या ऑनलाइन टेस्ट और PYQs बिल्कुल फ्री हैं?</p>
                        <p class="text-[11px] text-slate-600 leading-relaxed font-medium">हाँ, वेबसाइट पर उपलब्ध सभी Chapterwise टेस्ट और PYQ सेट्स बिहार बोर्ड के विद्यार्थियों के लिए बिल्कुल निःशुल्क हैं।</p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p class="font-bold text-slate-800">Q2. गाइड बुक का ऑर्डर कैसे करें?</p>
                        <p class="text-[11px] text-slate-600 leading-relaxed font-medium">होमपेज पर जाकर 'ऑर्डर करें' बटन दबाएँ या सीधे हमारे व्हाट्सएप नंबर पर अपना पता भेजकर बुक मँगवा सकते हैं।</p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p class="font-bold text-slate-800">Q3. लॉगिन पिन (PIN) भूल जाने पर क्या करें?</p>
                        <p class="text-[11px] text-slate-600 leading-relaxed font-medium">यदि आप अपना 4 अंकों का पिन भूल गए हैं, तो व्हाट्सएप पर अपना रजिस्टर्ड मोबाइल नंबर भेजें, हमारी टीम पिन रीसेट कर देगी।</p>
                    </div>
                </div>
            </div>

            <!-- 5. Back Button -->
            <div class="pt-1">
                <button type="button" onclick="goBackModalStep()" 
                        class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-2.5 rounded-xl text-xs active:scale-95 transition-transform cursor-pointer">
                    ← वापस जाएँ (Back)
                </button>
            </div>

        </div>
    `;

    openDynamicPage("सहायता एवं संपर्क", supportHtml);
};

// ==========================================================================
// 🟢 राज रौशन सर - प्रोफ़ाइल एवं परिचय मोडल (POPUP CONTROLLER)
// ==========================================================================
window.redirectToAboutSir = function() {
    window.closeSideMenuDirect(); // साइडबार बंद करेगा

    const aboutHtml = `
        <div class="max-w-md mx-auto space-y-4 text-left">
            
            <!-- 1. Hero Card: Profile Banner -->
            <div class="relative overflow-hidden bg-gradient-to-br from-crimson via-rose-800 to-slate-900 text-white p-5 rounded-3xl shadow-xl text-center border border-rose-200/20">
                <div class="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div class="absolute -bottom-10 -left-10 w-28 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none"></div>

                <!-- Avatar Badge -->
                <div class="relative w-20 h-20 mx-auto mb-3">
                    <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-rose-200 to-white p-1 shadow-lg shadow-black/30">
                        <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                            <i class="fa-solid fa-user-graduate text-amber-300"></i>
                        </div>
                    </div>
                    <span class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] border-2 border-slate-900 shadow-sm" title="Verified Educator">
                        <i class="fa-solid fa-check"></i>
                    </span>
                </div>

                <!-- Name & Title -->
                <h3 class="text-xl font-black tracking-tight leading-tight flex items-center justify-center space-x-1.5">
                    <span>RAJ RAUSHAN</span>
                </h3>
                <p class="text-xs font-bold text-amber-300 mt-0.5 tracking-wide uppercase">
                    Founder • Teacher • Author
                </p>
                <p class="text-[11px] text-rose-100/90 font-medium mt-1">
                    Student's Friend, Mentor & Motivator
                </p>
                
                <!-- Quick Badges -->
                <div class="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10 text-[10px] font-bold">
                    <span class="bg-white/15 px-2.5 py-1 rounded-full text-white">
                        <i class="fa-solid fa-book-open text-rose-300 mr-1"></i> BiharBoard Special
                    </span>
                    <span class="bg-white/15 px-2.5 py-1 rounded-full text-white">
                        <i class="fa-solid fa-lightbulb text-amber-300 mr-1"></i> Tips & Tricks
                    </span>
                    <span class="bg-white/15 px-2.5 py-1 rounded-full text-white">
                        <i class="fa-solid fa-location-dot text-emerald-300 mr-1"></i> MCQ
                    </span>
                </div>
            </div>

            <!-- 2. Message to Students -->
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2.5">
                <div class="flex items-center space-x-2 text-crimson font-black text-xs uppercase tracking-wider">
                    <i class="fa-solid fa-quote-left text-sm text-softPink"></i>
                    <span>विद्यार्थियों के नाम संदेश</span>
                </div>
                <p class="text-xs text-slate-700 leading-relaxed font-medium">
                    "प्रिय विद्यार्थियों, बिहार बोर्ड 9वीं और 10वीं की परीक्षा केवल याद करने का विषय नहीं है, बल्कि सही रणनीति और Concept की समझ है। 
                    हमारा उद्देश्य <strong class="text-crimson font-bold">SelfStudyBook</strong> के माध्यम से हर छात्र तक सरल, सटीक और बोर्ड परीक्षा उपयोगी अध्ययन सामग्री पहुँचाना है ताकि हर बच्चा आत्मविश्वास के साथ टॉपर बन सके।"
                </p>
            </div>

            <!-- 3. Key Achievements & Highlights -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 class="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-star text-amber-500"></i>
                    <span>प्रमुख विशेषताएँ एवं अनुभव</span>
                </h4>

                <div class="space-y-2 text-xs">
                    <div class="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50">
                        <div class="w-6 h-6 rounded-lg bg-rose-100 text-crimson flex items-center justify-center font-bold text-xs flex-none mt-0.5">
                            <i class="fa-solid fa-pen-nib"></i>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900">लेखक (Author - SelfStudy Books)</p>
                            <p class="text-[11px] text-slate-500">BSEB 9वीं व 10वीं के लिए Topicwise Objective और सूत्र आधारित गाइड पुस्तकों का संकलन।</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50">
                        <div class="w-6 h-6 rounded-lg bg-sky-100 text-accentBlue flex items-center justify-center font-bold text-xs flex-none mt-0.5">
                            <i class="fa-solid fa-laptop-code"></i>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900">तकनीक और नवाचार (EdTech)</p>
                            <p class="text-[11px] text-slate-500">ऑनलाइन टेस्ट, PYQ क्विज़ और डिजिटल प्लेटफ़ॉर्म का स्वयं निर्माण ताकि पढ़ाई आसान और रोचक बने।</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50">
                        <div class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-none mt-0.5">
                            <i class="fa-solid fa-hands-holding-child"></i>
                        </div>
                        <div>
                            <p class="font-bold text-slate-900">विद्यार्थी मार्गदर्शन (Mentorship)</p>
                            <p class="text-[11px] text-slate-500">हज़ारों छात्रों को बोर्ड परीक्षा में तनावमुक्त रहकर बेहतर अंक लाने की सरल रणनीति और प्रेरणा।</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. Direct Connect Buttons -->
            <div class="grid grid-cols-2 gap-2.5 pt-1">
                <a href="https://wa.me/919128919447?text=Hi%20Raj%20Sir,%20I%20have%20a%20question" target="_blank"
                   class="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-transform">
                    <i class="fa-brands fa-whatsapp text-sm"></i>
                    <span>WhatsApp संपर्क</span>
                </a>

                <a href="https://youtu.be/KksXwS3eGcs" target="_blank"
                   class="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-transform">
                    <i class="fa-brands fa-youtube text-sm"></i>
                    <span>YouTube देखें</span>
                </a>
            </div>

            <!-- Back/Close Button -->
            <div class="pt-2">
                <button type="button" onclick="goBackModalStep()" 
                        class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold py-2.5 rounded-xl text-xs active:scale-95 transition-transform cursor-pointer">
                    ← वापस जाएँ (Back)
                </button>
            </div>

        </div>
    `;

    // आपके डायनामिक मोडल इंजन से स्क्रीन खुलेगी
    openDynamicPage("राज रौशन सर के बारे में", aboutHtml);
};

// ==========================================================================
// 10.🟢 LOCAL AUTH & LOGOUT HANDLER
// ==========================================================================

// 1. साइडबार UI को अपडेट करने का फ़ंक्शन
window.applyStudentAuthToUI = function() {
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarClass = document.getElementById("sidebar-user-class");
    const logoutBtn = document.getElementById("sidebar-logout-btn");
    const authBox = document.getElementById("auth-logged-out-box"); // अगर ऊपर लॉगिन/साइनअप बॉक्स है

    // फोन के LocalStorage से डेटा उठाना
    const saved = localStorage.getItem("current_student");
    if (saved) {
        try {
            currentStudentProfile = JSON.parse(saved);
        } catch (e) {
            currentStudentProfile = null;
        }
    }

    if (currentStudentProfile && currentStudentProfile.name) {
        // नाम सेट करें
        if (sidebarName) sidebarName.innerText = currentStudentProfile.name;

        // क्लास सेट करें
        const cls = currentStudentProfile.student_class || currentStudentProfile.studentClass;
        if (sidebarClass) {
            if (cls === "10" || cls === "9") {
                sidebarClass.innerText = `Class ${cls}th)`;
            } else if (cls) {
                sidebarClass.innerText = `${cls}`;
            } else {
                sidebarClass.innerText = "Student Portal";
            }
        }

        // मेनू में लॉगआउट बटन दिखाएँ
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        // ऊपर का लॉगिन/रजिस्ट्रेशन बॉक्स चाहें तो छुपा दें
        if (authBox) authBox.classList.add("hidden");

    } else {
        // जब लॉगआउट हो (डिफ़ॉल्ट स्थिति)
        if (sidebarName) sidebarName.innerText = "विद्यार्थी पोर्टल";
        if (sidebarClass) sidebarClass.innerText = "Student Portal (BSEB 9th & 10th)";
        
        // लॉगआउट बटन छिपा दें
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (authBox) authBox.classList.remove("hidden");
    }
};

// 2. लॉगआउट पर क्लिक होने पर
window.handleStudentLogout = function() {
    if (confirm("क्या आप वाकई लॉगआउट करना चाहते हैं?")) {
        // LocalStorage से डेटा हटाएं
        localStorage.removeItem("current_student");
        currentStudentProfile = null;

        // साइडबार बंद करें
        if (typeof window.closeSideMenuDirect === 'function') {
            window.closeSideMenuDirect();
        }

        // साइडबार UI को वापस डिफ़ॉल्ट पर लाएं
        window.applyStudentAuthToUI();

        // होम पेज के सबसे ऊपर स्क्रॉल करें
        window.scrollTo({ top: 0, behavior: "smooth" });

        showToast("आप सफलतापूर्वक लॉगआउट हो चुके हैं!");
    }
};

// ==========================================================================
// 🟢 PWA INSTALLATION ENGINE (APP DOWNLOAD CONTROLLER)
// ==========================================================================
let deferredPrompt = null;

// 1. सर्विस वर्कर रजिस्टर करें
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log("PWA Service Worker Registered Successfully!"))
            .catch(err => console.log("Service Worker Registration Failed:", err));
    });
}

// 2. ब्राउज़र का इंस्टॉल प्रॉम्प्ट कैप्चर करें
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // डिफ़ॉल्ट बैनर रोकें
    deferredPrompt = e;
    console.log("🟢 App is ready to be installed!");
});

// 3. बटन क्लिक पर कॉल होने वाला फ़ंक्शन
window.installPWAApp = async function() {
    if (deferredPrompt) {
        // अगर ब्राउज़र सपोर्ट करता है तो डायरेक्ट सिस्टम का इंस्टॉल बॉक्स खोलें
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast("🎉 बधाई! ऐप डाउनलोड हो रहा है...");
        }
        deferredPrompt = null;
    } else {
        // अगर पहले से इंस्टॉल हो या सफारी/कुछ ब्राउज़र में डायरेक्ट प्रॉम्प्ट न आए
        showToast("ऐप इंस्टॉल करने के लिए ब्राउज़र मेनू (⋮) में जाकर 'Add to Home screen' या 'Install app' चुनें।");
    }
};

// 4. ऐप इंस्टॉल हो जाने पर
window.addEventListener('appinstalled', () => {
    showToast("✅ SelfStudyBook ऐप सफलतापूर्वक इंस्टॉल हो गया!");
    deferredPrompt = null;
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
        installBtn.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>इन्स्टॉल्ड</span>`;
        installBtn.classList.replace("from-emerald-600", "from-slate-600");
    }
});