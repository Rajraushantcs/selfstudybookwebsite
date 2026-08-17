// ==========================================
// SECTION 1: CONFIG, CONSTANTS & GLOBAL STATE
// ==========================================
const API_ENDPOINTS = {
    MATH_10TH: "DATA/10th/math/10th_maths_25_ques.json",
    MATH_9TH: "DATA/9th/math/9th_maths_25_ques.json",
    SCIENCE_9TH_CH1: "DATA/9th/science/ch1_ques.json"
};

const STORAGE_KEYS = {
    PROGRESS_9TH: "bseb_9th_math_set1_progress",
    PROGRESS_10TH: "bseb_10th_math_set1_progress"
};

const SCIENCE_10_PDF_URL = "https://storage.googleapis.com/selfstudybook-pdfs/PYQ/science_10_2025.pdf";

// Global App State Variables
let modalHistory = [];

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

// 9th Science Ch-1 State
let scienceCh1Data = null;
let currentCh1Answers = new Array(20).fill(null);

const class9ScienceChapters = [
    { id: 1, name: "अध्याय 1: हमारे आस-पास के पदार्थ" },
    { id: 2, name: "अध्याय 2: क्या हमारे आस-पास के पदार्थ शुद्ध हैं" },
    { id: 3, name: "अध्याय 3: परमाणु एवं अणु" },
    { id: 4, name: "अध्याय 4: परमाणु की संरचना" },
    { id: 5, name: "अध्याय 5: जीवन की मौलिक इकाई" },
    { id: 6, name: "अध्याय 6: ऊतक" },
    { id: 7, name: "अध्याय 7: जीवों में विविधता" },
    { id: 8, name: "अध्याय 8: गति" },
    { id: 9, name: "अध्याय 9: बल तथा गति के नियम" },
    { id: 10, name: "अध्याय 10: गुरुत्वाकर्षण" },
    { id: 11, name: "अध्याय 11: कार्य तथा ऊर्जा" },
    { id: 12, name: "अध्याय 12: ध्वनि" },
    { id: 13, name: "अध्याय 13: हम बीमार क्यों होते हैं" },
    { id: 14, name: "अध्याय 14: प्राकृतिक संपदा" },
    { id: 15, name: "अध्याय 15: खाद्य संसाधनों में सुधार" }
];


// ==========================================
// SECTION 2: UI & MODAL MANAGEMENT HELPERS
// ==========================================
function showToast(message) {
    const toastMessage = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");

    if (!toastMessage || !toastText) {
        console.log("Toast Notice:", message);
        return;
    }
    toastText.innerText = message;
    toastMessage.classList.remove("hidden");
    setTimeout(() => toastMessage.classList.add("hidden"), 2500);
}

window.openDynamicPage = function(title, htmlContent, isNewFlow = false) {
    if (isNewFlow) modalHistory = [];
    modalHistory.push({ title, htmlContent });
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
    let backHeaderHTML = "";

    if (modalHistory.length > 1) {
        backHeaderHTML = `
            <div class="mb-3 border-b border-slate-100 pb-2">
                <button onclick="goBackModalStep()" class="inline-flex items-center space-x-1.5 text-xs font-black text-crimson hover:text-rose-900 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 active:scale-95 transition-all">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i>
                    <span>वापस जाएँ (Back)</span>
                </button>
            </div>
        `;
    }

    if (dynamicViewTitle) dynamicViewTitle.innerText = current.title;
    if (dynamicViewBody) dynamicViewBody.innerHTML = backHeaderHTML + current.htmlContent;
    if (dynamicViewModal) {
        dynamicViewModal.classList.remove("hidden");
        dynamicViewModal.classList.add("flex");
    }

    window.scrollTo(0, 0);
    if (window.lucide) lucide.createIcons();
}

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


// ==========================================
// SECTION 3: NAVIGATION PORTALS & TEMPLATES
// ==========================================
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
                    <span class="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Jaldi Upload Hoga</span>
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
            ${sub.action.includes('math') ? '<span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Live Active</span>' : '<span class="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Jaldi Upload Hoga</span>'}
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
            <p class="text-[11px] text-slate-500 font-medium">इस विषय के मॉडल सेट्स और लाइव टेस्ट पर काम चल रहा है, बहुत जल्द उपलब्ध होंगे।</p>
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
            <p class="text-[11px] text-slate-600">पिछले 5 सालों के प्रश्न पत्र का कलेक्शन जल्द उपलब्ध होगा।</p>
            <button onclick="goBackModalStep()" class="bg-amber-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm">
                वापस जाएँ (Back)
            </button>
        </div>`;
    openDynamicPage("PYQ Question Bank", htmlContent, true);
}


// ==========================================
// SECTION 4: CLASS 9TH MATH TEST ENGINE (JSON FETCH)
// ==========================================

window.startBSEB9thMathTest = async function() {
    showToast("9th गणित टेस्ट लोड हो रहा है...");
    try {
        const response = await fetch(API_ENDPOINTS.MATH_9TH, { 
            cache: "no-cache",
            headers: {
                "Accept": "application/json"
            }
        });

        // MIME Type और HTTP Status Validation
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
            throw new Error(`Server status: ${response.status}`);
        }
        if (contentType && !contentType.includes("application/json")) {
            throw new TypeError("MIME Type Error: Expected JSON response.");
        }

        const jsonData = await response.json();
        
        // Normalize Data Structure
        const questionsList = Array.isArray(jsonData) ? jsonData : (jsonData.questions || []);

        if (!questionsList.length) {
            throw new Error("Invalid or empty questions array");
        }

        testData9th = {
            title: "BSEB 9th Mathematics Model Set 1",
            questions: questionsList
        };

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
        console.error("9th Math Loading Error:", error);
        showToast("JSON Load Error: File Path या Casing चेक करें!");
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
    const data = {
        currentQuestionIndex: currentQuestionIndex9th,
        userAnswers: userAnswers9th,
        visitedQuestions: visitedQuestions9th,
        timeRemaining: timeRemaining9th
    };
    localStorage.setItem(STORAGE_KEYS.PROGRESS_9TH, JSON.stringify(data));
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
                    <i data-lucide="pause" class="w-3 h-3 fill-current"></i>
                    <span>Pause</span>
                </button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-rose-500/30 flex items-center space-x-1 text-rose-400 font-mono text-xs font-bold">
                    <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                    <span id="quiz-timer-9th">30:00</span>
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

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
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
            userAnswers9th[index] === optIdx 
            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500'
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
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

// ==========================================
// SECTION 4: SUBMIT QUIZ WITH EXPLANATION (UPDATED)
// ==========================================
window.submitFinalQuiz9th = function() {
    if (timerInterval9th) clearInterval(timerInterval9th);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS_9TH);

    let score = 0, correctCount = 0, wrongCount = 0, unattemptedCount = 0;
    const totalQ = testData9th.questions.length;
    let solutionsHTML = "";

    testData9th.questions.forEach((q, idx) => {
        const userAnsIdx = userAnswers9th[idx];
        const isCorrect = (userAnsIdx === q.answer);

        let statusBadge = "";
        let cardBorder = "";

        if (userAnsIdx === null) {
            unattemptedCount++;
            statusBadge = `<span class="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">छोड़ा गया</span>`;
            cardBorder = "border-slate-200 bg-slate-50/50";
        } else if (isCorrect) {
            score++; correctCount++;
            statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">✓ सही</span>`;
            cardBorder = "border-emerald-300 bg-emerald-50/30";
        } else {
            wrongCount++;
            statusBadge = `<span class="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md">✗ गलत</span>`;
            cardBorder = "border-rose-300 bg-rose-50/30";
        }

        const userOptionText = userAnsIdx !== null ? q.options[userAnsIdx] : 'कोई विकल्प नहीं चुना';
        const correctOptionText = q.options[q.answer];

        solutionsHTML += `
            <div class="p-3.5 rounded-2xl border ${cardBorder} text-left space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span class="text-xs font-black text-slate-800">Q${idx + 1}. ${q.question}</span>
                    ${statusBadge}
                </div>
                <div class="text-[11px] font-bold space-y-1 pt-1">
                    <p class="text-slate-600">आपका उत्तर: <span class="${isCorrect ? 'text-emerald-700' : 'text-rose-600'} font-black">${userOptionText}</span></p>
                    <p class="text-emerald-700">सही उत्तर: <span class="font-black">${correctOptionText}</span></p>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 mt-2">
                    <span class="font-black text-slate-900 block mb-0.5">व्याख्या (Explanation):</span>
                    ${q.explanation || "कोई व्याख्या उपलब्ध नहीं है।"}
                </div>
            </div>`;
    });

    const scoreHTML = `
        <div class="bg-white p-4 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">✓</div>
            <div>
                <h2 class="text-base font-black text-slate-900">Test Result Summary</h2>
                <p class="text-[11px] text-slate-500 font-bold">${testData9th.title || "Class 9th Mathematics Test"}</p>
            </div>
            <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 space-y-0.5">
                <div class="text-2xl font-black text-emerald-700">${score} / ${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Total Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">सही: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">गलत: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">छोड़े: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2">
                <h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल (Solution & Explanation)</h3>
                <div class="space-y-3">${solutionsHTML}</div>
            </div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0">Finish & Close</button>
        </div>`;

    openDynamicPage("Scorecard Result", scoreHTML, true);
};

// ==========================================
// SECTION 5: CLASS 10TH MATH TEST ENGINE (JSON FETCH)
// ==========================================
window.startBSEB10thMathTest = async function() {
    showToast("लोड हो रहा है, कृपया प्रतीक्षा करें...");

    try {
        const response = await fetch(API_ENDPOINTS.MATH_10TH, { cache: "force-cache" });
        if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

        const jsonData = await response.json();
        activeTestData10th = Array.isArray(jsonData) ? { questions: jsonData } : jsonData;

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
        console.error("JSON Loading Failed:", error);
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
    const progressData = { 
        currentQuestionIndex: currentQuestionIndex10th, 
        userAnswers: userAnswers10th, 
        visitedQuestions: visitedQuestions10th, 
        timeRemaining: timeRemaining10th 
    };
    localStorage.setItem(STORAGE_KEYS.PROGRESS_10TH, JSON.stringify(progressData));
}

function render10thQuizUI() {
    const totalQ = activeTestData10th.questions.length;
    const testUIHTML = `
        <div class="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md mb-2">
            <div>
                <h2 class="text-xs font-black text-sky-400">${activeTestData10th.title || "BSEB 10th Mathematics Model Set 1"}</h2>
                <p class="text-[10px] text-slate-400 font-bold">${totalQ} Questions • Live Test</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="pause10thQuiz()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1">
                    <i data-lucide="pause" class="w-3 h-3 fill-current"></i>
                    <span>Pause</span>
                </button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-sky-500/30 flex items-center space-x-1 text-sky-400 font-mono text-xs font-bold">
                    <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                    <span id="quiz-10th-timer">30:00</span>
                </div>
            </div>
        </div>

        <div id="quiz-question-card-10th" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span id="q10-badge" class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Question 1 of ${totalQ}</span>
                <span class="text-[10px] text-slate-400 font-bold">+1 Mark</span>
            </div>
            <h3 id="q10-text" class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pt-1"></h3>
            <div id="q10-options" class="space-y-2 pt-1"></div>
        </div>

        <div class="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <button id="prev-10th-btn" onclick="navigate10thQuestion(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
            <button onclick="clear10thChoice()" class="text-[11px] text-sky-600 font-bold hover:underline">Clear Choice</button>
            <button id="next-10th-btn" onclick="navigate10thQuestion(1)" class="bg-accentBlue hover:bg-sky-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Next</button>
        </div>

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4>
                <span class="text-[10px] text-slate-400">Tap to jump</span>
            </div>
            <div id="question-palette-10th" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinal10thQuiz()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all">SUBMIT TEST NOW</button>
        </div>`;

    openDynamicPage("Class 10th Mathematics Test", testUIHTML, true);
}

window.render10thQuestion = function(index) {
    const q = activeTestData10th.questions[index];
    const totalQ = activeTestData10th.questions.length;
    visitedQuestions10th[index] = true;
    autoSave10thProgress();

    document.getElementById("q10-badge").innerText = `Question ${index + 1} of ${totalQ}`;
    document.getElementById("q10-text").innerHTML = q.question;

    const container = document.getElementById("q10-options");
    container.innerHTML = q.options.map((opt, optIdx) => `
        <label onclick="select10thOption(${index}, ${optIdx})" class="flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
            userAnswers10th[index] === optIdx 
            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500'
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
        }">
            <input type="radio" name="opt10" ${userAnswers10th[index] === optIdx ? 'checked' : ''} class="accent-emerald-600 w-4 h-4">
            <span class="text-xs sm:text-sm">${opt}</span>
        </label>`).join('');

    document.getElementById("prev-10th-btn").disabled = (index === 0);
    render10thPalette();
};

window.select10thOption = function(qIdx, optIdx) { userAnswers10th[qIdx] = optIdx; render10thQuestion(qIdx); };
window.clear10thChoice = function() { userAnswers10th[currentQuestionIndex10th] = null; render10thQuestion(currentQuestionIndex10th); };

window.navigate10thQuestion = function(step) {
    const totalQ = activeTestData10th.questions.length;
    currentQuestionIndex10th += step;
    if (currentQuestionIndex10th < 0) currentQuestionIndex10th = 0;
    if (currentQuestionIndex10th >= totalQ) currentQuestionIndex10th = totalQ - 1;
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

        let statusBadge = "";
        let cardBorder = "";

        if (userAnsIdx === null) {
            unattemptedCount++;
            statusBadge = `<span class="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md">छोड़ा गया</span>`;
            cardBorder = "border-slate-200 bg-slate-50/50";
        } else if (isCorrect) {
            score++; correctCount++;
            statusBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">✓ सही</span>`;
            cardBorder = "border-emerald-300 bg-emerald-50/30";
        } else {
            wrongCount++;
            statusBadge = `<span class="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md">✗ गलत</span>`;
            cardBorder = "border-rose-300 bg-rose-50/30";
        }

        solutionsHTML += `
            <div class="p-3.5 rounded-2xl border ${cardBorder} text-left space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span class="text-xs font-black text-slate-800">Q${idx + 1}. ${q.question}</span>
                    ${statusBadge}
                </div>
                <div class="text-[11px] font-bold space-y-1 pt-1">
                    <p class="text-slate-600">उत्तर: <span class="${isCorrect ? 'text-emerald-700' : 'text-rose-600'} font-black">${selectedOptionText ? selectedOptionText : 'कोई विकल्प नहीं चुना'}</span></p>
                    <p class="text-emerald-700">सही उत्तर: <span class="font-black">${q.answer}</span></p>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 mt-2">
                    <span class="font-black text-slate-900 block mb-0.5">व्याख्या:</span>
                    ${q.explanation || "कोई व्याख्या उपलब्ध नहीं है।"}
                </div>
            </div>`;
    });

    const scoreHTML = `
        <div class="bg-white p-4 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">✓</div>
            <div>
                <h2 class="text-base font-black text-slate-900">Test Result Summary</h2>
                <p class="text-[11px] text-slate-500 font-bold">${activeTestData10th.title || "Class 10th Mathematics Test"}</p>
            </div>
            <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 space-y-0.5">
                <div class="text-2xl font-black text-emerald-700">${score} / ${totalQ}</div>
                <div class="text-[10px] font-bold text-slate-600">Total Score (${((score / totalQ) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">Sahi: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">Galat: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">Chhode: ${unattemptedCount}</div>
            </div>
            <div class="space-y-3 pt-2">
                <h3 class="text-xs font-black text-slate-800 text-left uppercase tracking-wider">प्रश्न और उनके हल</h3>
                <div class="space-y-3">${solutionsHTML}</div>
            </div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform sticky bottom-0">Finish & Close</button>
        </div>`;

    openDynamicPage("Scorecard Result", scoreHTML, true);
};


// ==========================================
// SECTION 6: CHAPTERWISE PRACTICE ENGINE (CLASS 9TH SCIENCE)
// ==========================================
async function renderClass9Ch1PracticeTest() {
    if (!scienceCh1Data) {
        showToast("लोड हो रहा है...");
        try {
            const res = await fetch(API_ENDPOINTS.SCIENCE_9TH_CH1);
            const questions = await res.json();
            scienceCh1Data = {
                title: "अध्याय 1: हमारे आस-पास के पदार्थ (Practice Test)",
                questions: questions
            };
        } catch (e) {
            showToast("JSON file load failed!");
            return;
        }
    }

    let questionsHTML = scienceCh1Data.questions.map((q, qIdx) => {
        const selectedOpt = currentCh1Answers[qIdx];
        const isAnswered = selectedOpt !== null;

        let optionsHTML = q.options.map((opt, optIdx) => {
            let btnStyle = "bg-white border-slate-200 text-slate-800 hover:bg-slate-50";

            if (isAnswered) {
                if (optIdx === q.answer) {
                    btnStyle = "bg-emerald-100 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-500";
                } else if (selectedOpt === optIdx) {
                    btnStyle = "bg-rose-100 border-rose-600 text-rose-900 font-bold ring-2 ring-rose-500";
                } else {
                    btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                }
            }

            return `
                <button onclick="handleCh1OptionSelect(${qIdx}, ${optIdx})" ${isAnswered ? 'disabled' : ''} class="w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between ${btnStyle}">
                    <span>${String.fromCharCode(65 + optIdx)}) ${opt}</span>
                    ${isAnswered && optIdx === q.answer ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-none"></i>' : ''}
                    ${isAnswered && selectedOpt === optIdx && selectedOpt !== q.answer ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-600 flex-none"></i>' : ''}
                </button>`;
        }).join('');

        let explanationHTML = "";
        if (isAnswered) {
            const isCorrect = selectedOpt === q.answer;
            explanationHTML = `
                <div class="mt-3 p-3.5 rounded-2xl ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'} space-y-1 animate-fadeIn">
                    <div class="flex items-center space-x-1.5 text-xs font-black ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}">
                        <i data-lucide="${isCorrect ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
                        <span>${isCorrect ? 'सही उत्तर!' : 'गलत उत्तर! सही उत्तर विकल्प (' + String.fromCharCode(65 + q.answer) + ') है।'}</span>
                    </div>
                    <p class="text-[11px] font-bold text-slate-700 leading-relaxed pt-0.5">
                        <span class="font-black text-slate-900">व्याख्या:</span> ${q.explanation}
                    </p>
                </div>`;
        }

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 mb-4">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">${q.question}</h3>
                <div class="space-y-2">${optionsHTML}</div>
                ${explanationHTML}
            </div>`;
    }).join('');

    const pageContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">Chapterwise Live Practice</span>
            <h2 class="text-base font-black text-slate-900">${scienceCh1Data.title}</h2>
            <p class="text-[11px] text-slate-500 font-bold">सही विकल्प चुनें और उत्तर के साथ व्याख्या तुरंत देखें:</p>
        </div>
        <div>${questionsHTML}</div>`;

    openDynamicPage("Chapter 1: हमारे आस-पास के पदार्थ", pageContent);
}

window.handleCh1OptionSelect = function(qIdx, optIdx) {
    currentCh1Answers[qIdx] = optIdx;
    renderClass9Ch1PracticeTest();
};

function openClass9ScienceChapters() {
    let chaptersHTML = class9ScienceChapters.map(chap => `
        <button data-action="open-chapter-quiz" data-chapter-id="${chap.id}" data-chapter-name="${chap.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 hover:border-crimson p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
            <div class="flex items-center space-x-3">
                <div class="w-7 h-7 rounded-lg bg-rose-100 text-crimson font-black text-xs flex items-center justify-center flex-none">
                    ${chap.id}
                </div>
                <span class="text-xs font-bold text-slate-800 leading-snug">${chap.name}</span>
            </div>
            <i data-lucide="arrow-right-circle" class="w-4 h-4 text-crimson flex-none ml-2"></i>
        </button>`).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Class 9th Science</span>
            <h2 class="text-base font-black text-slate-900">विषय सूची (Chapter List)</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रैक्टिस करने के लिए किसी भी अध्याय पर क्लिक करें:</p>
        </div>
        <div class="space-y-2">${chaptersHTML}</div>`;

    openDynamicPage("Class 9 Science Chapters", pageHTML);
}

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
        { name: "2. विज्ञान (Science)", action: "subject-coming-soon" },
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

function openChapterQuizPlaceholder(chapName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <h2 class="text-base font-black text-slate-900">${chapName}</h2>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p class="text-xs font-bold text-amber-900">जल्द ही प्रैक्टिस Questions अपलोड किए जाएंगे!</p>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">इस चैप्टर के प्रश्न उत्तर और ऑनलाइन टेस्ट पर काम चल रहा है।</p>
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
                वापस जाएं (Back)
            </button>
        </div>`;
    openDynamicPage("Practice Set", htmlContent);
}


// ==========================================
// SECTION 7: INITIALIZATION & GLOBAL EVENT LISTENERS
// ==========================================
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

    // MAIN EVENT DELEGATION
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if (!target) return;

        const action = target.getAttribute("data-action");

        switch (action) {
            case "toggle-menu":
            case "open-menu":
                openSideMenu();
                break;
            case "quick-model-sets":
            case "open-model-sets":
                openModelSetsPortal();
                break;
            case "quick-tests":
            case "open-tests":
                openTestsPortal();
                break;
            case "quick-pyq":
            case "open-pyq":
                openPYQPortal();
                break;
            case "open-10th-model-subjects":
                renderModelSubjects(10);
                break;
            case "open-9th-model-subjects":
                renderModelSubjects(9);
                break;
            case "open-10th-test-subjects":
                renderTestSubjects(10);
                break;
            case "open-9th-test-subjects":
                renderTestSubjects(9);
                break;
            case "open-chapterwise-practice":
                openChapterwisePracticePortal();
                break;
            case "open-9th-chapterwise-subjects":
                renderChapterwiseSubjects("Class 9th", true);
                break;
            case "open-10th-chapterwise-subjects":
                renderChapterwiseSubjects("Class 10th", false);
                break;
            case "open-9th-science-chapters":
                openClass9ScienceChapters();
                break;
            case "open-10th-math-test":
                startBSEB10thMathTest();
                break;
            case "open-9th-math-test":
                startBSEB9thMathTest();
                break;
            case "open-chapter-quiz": {
                const chapId = target.getAttribute("data-chapter-id");
                if (chapId === "1") {
                    currentCh1Answers = new Array(20).fill(null);
                    renderClass9Ch1PracticeTest();
                } else {
                    const chapName = target.getAttribute("data-chapter-name");
                    openChapterQuizPlaceholder(chapName);
                }
                break;
            }
            case "open-coming-soon-subject": {
                const subjectName = target.getAttribute("data-subject");
                showComingSoonModal(subjectName);
                break;
            }
            case "buy-book": {
                const bookId = target.getAttribute("data-book-id");
                window.open(`https://wa.me/919128919447?text=Hi%20Raj%20Sir,%20I%20want%20to%20order%20Book%20ID:%20${bookId}`, "_blank");
                break;
            }
            case "coming-soon":
                showToast("बहुत ही जल्द यह सुविधा चालू होगी!");
                break;
            case "subject-coming-soon":
                showToast("यह विषय बहुत जल्द अपलोड किया जाएगा!");
                break;
        }
    });

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSideMenu);
    if (sideMenuOverlay) {
        sideMenuOverlay.addEventListener("click", (e) => {
            if (e.target === sideMenuOverlay) closeSideMenu();
        });
    }

    if (closeViewBtn) closeViewBtn.addEventListener("click", closeDynamicPage);
});