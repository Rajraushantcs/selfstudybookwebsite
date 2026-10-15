// ==========================================================================
// SECTION 1: APP CONFIGURATION & GLOBAL STATE
// ==========================================================================
const APP_VERSION = "1.0"; // वर्ज़न कंट्रोल
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
document.addEventListener("DOMContentLoaded", loadMasterIndex);


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
        // 🟢 फिक्स: क्विज़ में ऑप्शन क्लिक करने पर यह नया स्टेप नहीं जोड़ेगा,
        // जिससे बैक दबाने पर एक ही बार में चैप्टर लिस्ट खुलेगी।
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
                <button data-action="open-coming-soon-subject" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
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
            <button data-action="open-10th-model-subjects" class="w-full text-left bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all">
                <div class="flex items-center space-x-3">
                    <i data-lucide="award" class="w-6 h-6"></i>
                    <div>
                        <h3 class="text-xs font-black">Model Sets for Class 10th</h3>
                        <p class="text-[10px] text-rose-200 font-bold">Bihar Board Class 10th All Subjects</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-9th-model-subjects" class="w-full text-left bg-gradient-to-r from-sky-600 to-accentBlue text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all">
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
            <button data-action="open-10th-test-subjects" class="w-full text-left bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all">
                <div class="flex items-center space-x-3">
                    <i data-lucide="radio" class="w-6 h-6 animate-pulse"></i>
                    <div>
                        <h3 class="text-xs font-black">Live Test for Class 10th</h3>
                        <p class="text-[10px] text-rose-200 font-bold">Bihar Board Class 10th Live Tests</p>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-9th-test-subjects" class="w-full text-left bg-gradient-to-r from-sky-600 to-accentBlue text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all">
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
        <button data-action="${sub.action}" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
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
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
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
            <button onclick="goBackModalStep()" class="bg-amber-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm">
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
            <button data-action="open-9th-chapterwise-subjects" class="w-full bg-gradient-to-r from-accentBlue to-blue-700 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-md active:scale-98 transition-transform">
                <div class="flex items-center space-x-3">
                    <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                    <span>Class 9th Chapter Wise Practice</span>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
            <button data-action="open-10th-chapterwise-subjects" class="w-full bg-gradient-to-r from-crimson to-rose-700 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-md active:scale-98 transition-transform">
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
        <button data-action="${sub.action}" class="w-full bg-white hover:bg-rose-50 border ${sub.highlight ? 'border-crimson ring-1 ring-crimson/30' : 'border-slate-200'} p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-transform">
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
        <button data-action="${action}" data-json-url="${chap.json_url}" data-chapter-name="${chap.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 hover:border-crimson p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
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
                <button onclick="handleUniversalOptionSelect(${qIdx}, ${optIdx})" ${isAnswered ? 'disabled' : ''} class="w-full text-left p-3.5 rounded-xl border text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-between ${btnStyle}">
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
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
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
                <button onclick="pauseQuiz9th()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1">
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
            <button id="prev-btn-9th" onclick="navigateQuestion9th(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
            <button onclick="clearChoice9th()" class="text-[11px] text-rose-600 font-bold hover:underline">Clear Choice</button>
            <button id="next-btn-9th" onclick="navigateQuestion9th(1)" class="bg-crimson hover:bg-rose-900 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Next</button>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 mt-2">
            <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4>
                <span class="text-[10px] text-slate-400">Tap to jump</span>
            </div>
            <div id="question-palette-9th" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinalQuiz9th()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all">SUBMIT TEST NOW</button>
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
        return `<button onclick="jumpToQuestion9th(${idx})" class="w-8 h-8 text-[11px] rounded-lg font-bold border flex items-center justify-center transition-all ${btnStatusClass}">${idx + 1}</button>`;
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
                <div class="text-2xl font-black text-emerald-700">${score} / ${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">सही: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">गलत: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">छोड़े: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2"><h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल</h3><div class="space-y-3">${solutionsHTML}</div></div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0">Finish & Close</button>
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
                <button onclick="pause10thQuiz()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1"><i data-lucide="pause" class="w-3 h-3 fill-current"></i><span>Pause</span></button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-sky-500/30 flex items-center space-x-1 text-sky-400 font-mono text-xs font-bold"><i data-lucide="timer" class="w-3.5 h-3.5"></i><span id="quiz-10th-timer">30:00</span></div>
            </div>
        </div>
        <div id="quiz-question-card-10th" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2"><span id="q10-badge" class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Question 1 of ${totalQ}</span><span class="text-[10px] text-slate-400 font-bold">+1 Mark</span></div>
            <h3 id="q10-text" class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pt-1"></h3>
            <div id="q10-options" class="space-y-2 pt-1"></div>
        </div>
        <div class="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <button id="prev-10th-btn" onclick="navigate10thQuestion(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
            <button onclick="clear10thChoice()" class="text-[11px] text-sky-600 font-bold hover:underline">Clear Choice</button>
            <button id="next-10th-btn" onclick="navigate10thQuestion(1)" class="bg-accentBlue hover:bg-sky-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Next</button>
        </div>
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 mt-2">
            <div class="flex items-center justify-between"><h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4></div>
            <div id="question-palette-10th" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinal10thQuiz()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all">SUBMIT TEST NOW</button>
        </div>`;
    openDynamicPage("Class 10th Mathematics Test", testUIHTML, true);
}

window.render10thQuestion = function(index) {
    const q = activeTestData10th.questions[index];
    visitedQuestions10th[index] = true;
    autoSave10thProgress();

    document.getElementById("q10-badge").innerText = `Question ${index + 1} of ${activeTestData10th.questions.length}`;
    document.getElementById("q10-text").innerHTML = q.question;

    const container = document.getElementById("q10-options");
    container.innerHTML = q.options.map((opt, optIdx) => `
        <label onclick="select10thOption(${index}, ${optIdx})" class="flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${userAnswers10th[index] === optIdx ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'}">
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
        return `<button onclick="jumpTo10thQuestion(${idx})" class="w-8 h-8 text-[11px] rounded-lg font-bold border flex items-center justify-center transition-all ${btnStatusClass}">${idx + 1}</button>`;
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
                <div class="text-2xl font-black text-emerald-700">${score} / ${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">Sahi: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">Galat: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">Chhode: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2"><h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल</h3><div class="space-y-3">${solutionsHTML}</div></div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0">Finish & Close</button>
        </div>`;
    openDynamicPage("Scorecard Result", scoreHTML, true);
};


// ==========================================================================
// SECTION 7: GLOBAL EVENT LISTENERS & ROUTING
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
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

    function closeSideMenu() {
        if (!sideMenuOverlay || !sideMenuContent) return;
        sideMenuContent.classList.add("-translate-x-full");
        setTimeout(() => sideMenuOverlay.classList.add("hidden"), 300);
    }

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
        }
    });

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSideMenu);
    if (sideMenuOverlay) sideMenuOverlay.addEventListener("click", (e) => { if (e.target === sideMenuOverlay) closeSideMenu(); });
    
    // 🟢 टॉप हेडर बैक बटन: सीधे 1 स्तर पीछे ले जाएगा
    if (closeViewBtn) closeViewBtn.addEventListener("click", () => {
        goBackModalStep();
    });
});


// ==========================================================================
// SECTION 8: 🟣 PYQ CHAPTERWISE PORTAL (CLEAN & MODULAR)
// ==========================================================================

// 8.1: छह प्रमुख विषयों और अध्यायों का मास्टर कॉन्फिगरेशन
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
            { id: 11, name: "11. नौबतखाने में इबादत", json_url: "DATA/10th/hindi/ch10.json" },
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

// 8.2: 6 विषयों का सुंदर ग्रिड (बिना किसी 'उपलब्ध' या 'शीघ्र' बैज के - पूर्णतः न्यूट्रल)
function openPYQSubjectsPortal() {
    let subjectsHTML = PYQ_MASTER_SUBJECTS.map((sub) => {
        return `
        <button onclick="handlePYQSubjectClick('${sub.id}')" class="w-full text-left bg-white hover:bg-rose-50/50 p-4 rounded-2xl border ${sub.border} shadow-sm active:scale-98 transition-all flex items-center justify-between group">
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

// 8.3: सब्जेक्ट क्लिक हैंडलर (क्लिक पर ही जांच होगी)
window.handlePYQSubjectClick = function(subjectId) {
    const subject = PYQ_MASTER_SUBJECTS.find(s => s.id === subjectId);
    if (!subject) return;

    if (!subject.chapters || subject.chapters.length === 0) {
        showPYQSubjectPendingWarning(subject.name);
        return;
    }

    renderPYQChaptersList(subject);
};

// 8.4: सब्जेक्ट पेंडिंग अलर्ट
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
            <button onclick="goBackModalStep()" class="w-full bg-crimson hover:bg-rose-900 text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
                ← वापस विषयों की सूची पर जाएँ
            </button>
        </div>`;
    openDynamicPage("सूचना (Notification)", htmlContent);
}

// 8.5: चैप्टर्स की लिस्ट (एक समान व साफ़ डिज़ाइन - बिना किसी 'MCQ उपलब्ध' बैज के)
function renderPYQChaptersList(subject) {
    let chaptersHTML = subject.chapters.map((chap, idx) => {
        const isReady = chap.json_url !== null && chap.json_url !== "";
        return `
        <button onclick="${isReady ? `loadPYQQuizJSON('${chap.json_url}', '${chap.name}')` : `showPYQChapterPendingWarning('${chap.name}')`}" 
                class="w-full text-left bg-white hover:bg-rose-50/50 p-4 rounded-2xl border border-slate-200 hover:border-crimson shadow-xs active:scale-98 transition-all flex items-center justify-between group">
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

// 8.6: चैप्टर पेंडिंग अलर्ट
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
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
                ← वापस अध्याय सूची पर जाएँ
            </button>
        </div>`;
    openDynamicPage("शीघ्र उपलब्ध", htmlContent);
}

// 8.7: चैप्टर JSON लोड करना
window.loadPYQQuizJSON = async function(jsonUrl, chapterTitle) {
    try {
        const fetchUrl = jsonUrl + "?v=" + APP_VERSION;
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error("JSON Fetch Failed");
        const questions = await res.json();

        currentPracticeData = questions;
        currentPracticeTitle = chapterTitle;
        currentPracticeAnswers = new Array(questions.length).fill(null);

        // पहली बार क्विज़ खोलते समय isUpdate = false रहेगा
        renderPYQQuizUI(false);
    } catch (e) {
        showToast("यह चैप्टर फ़ाइल लोड नहीं हो सकी।");
        console.error("PYQ Quiz Load Error:", e);
    }
};

// 8.8: क्विज़ का इंटरेक्टिव UI (बड़ा फ़ॉन्ट + इन-प्लेस अपडेट)
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
                <button onclick="handlePYQOptionSelect(${qIdx}, '${key}')" ${isAnswered ? 'disabled' : ''} class="w-full text-left p-3.5 rounded-xl border text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-between ${btnStyle}">
                    <span>(${key.toUpperCase()}) ${optText}</span>
                    ${isAnswered && key.toLowerCase() === correctAnswerKey.toLowerCase() ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-none"></i>' : ''}
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
                    <span class="bg-rose-50 text-crimson text-xs font-black px-2.5 py-0.5 rounded-md">प्रश्न संख्या ${qIdx + 1}</span>
                    ${yearsBadgeHTML}
                </div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">${q.question}</h3>
                <div class="space-y-2.5 pt-1">${optionsHTML}</div>
                ${explanationHTML}
            </div>`;
    }).join('');

    const pageContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3 sticky top-0 z-10">
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">PYQ Chapter Wise Practice</span>
            <h2 class="text-base font-black text-slate-900">${currentPracticeTitle}</h2>
        </div>
        <div class="pb-6">${questionsHTML}</div>`;

    // 🟢 यहाँ `isUpdate` पास होता है, जिससे उत्तर चुनने पर हिस्ट्री स्टैक में नया पेज नहीं जुड़ता
    openDynamicPage("PYQ Test", pageContent, false, isUpdate);
}

// 8.9: उत्तर चुनने पर इन-प्लेस री-रेंडर
window.handlePYQOptionSelect = function(qIdx, optKey) {
    currentPracticeAnswers[qIdx] = optKey;
    renderPYQQuizUI(true); // isUpdate = true
};