// SelfStudyBook.com - Main Application JavaScript (Updated with Model Sets & Live Tests)

// ==========================================
// 1. STORAGE KEYS & GLOBAL VARIABLES
// ==========================================
const STORAGE_KEY_PROGRESS = "bseb_9th_math_set1_progress";
const STORAGE_KEY_HISTORY = "bseb_9th_math_history";

// Global Stack Navigation & Timer Variables
let modalHistory = [];
let timerInterval = null;
let timeRemaining = 30 * 60;
let currentQuestionIndex = 0;
let userAnswers = new Array(25).fill(null);
let visitedQuestions = new Array(25).fill(false);

// Direct PDF Download Link
const SCIENCE_10_PDF_URL = "https://storage.googleapis.com/selfstudybook-pdfs/PYQ/science_10_2025.pdf";

// State Variables for Interactive Test
let currentCh1Answers = new Array(20).fill(null);

// ==========================================
// 2. HELPER & NAVIGATION PORTAL FUNCTIONS
// ==========================================

// Subject List Generator Helper
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
                </a>
            `;
        } else {
            return `
                <button data-action="open-coming-soon-subject" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
                    <span class="text-xs font-bold text-slate-800">${sub.name}</span>
                    <span class="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Jaldi Upload Hoga</span>
                </button>
            `;
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
        </div>
    `;
    openDynamicPage("Model Sets", htmlContent, true);
}

function renderModelSubjects(classNum) {
    const pageTitle = `Model Sets for Class ${classNum}th`;
    const subjectsHTML = generateSubjectButtonsHTML(classNum);
    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-crimson text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">Class ${classNum}th Model Sets</span>
            <h2 class="text-base font-black text-slate-900">विषयों की सूची (Subjects)</h2>
            <p class="text-[11px] text-slate-500 font-bold">मॉडल पेपर देखने या डाउनलोड करने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">
            ${subjectsHTML}
        </div>
    `;
    openDynamicPage(pageTitle, htmlContent);
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
        </div>
    `;
    openDynamicPage("Live Test", htmlContent, true);
}

function renderTestSubjects(classNum) {
    const pageTitle = `Live Test for Class ${classNum}th`;
    const subjects = [
        { id: 'science', name: '1. विज्ञान (Science)' },
        { id: 'math', name: '2. गणित (Mathematics)' },
        { id: 'sst', name: '3. सामाजिक विज्ञान (Social Science)' },
        { id: 'hindi', name: '4. हिंदी (Hindi)' },
        { id: 'sanskrit', name: '5. संस्कृत (Sanskrit)' },
        { id: 'english', name: '6. अंग्रेजी (English)' }
    ];

    let subjectsHTML = subjects.map(sub => `
        <button data-action="open-coming-soon-subject" data-subject="${sub.name}" class="w-full text-left bg-white hover:bg-rose-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition-all">
            <span class="text-xs font-bold text-slate-800">${sub.name}</span>
            <span class="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Jaldi Upload Hoga</span>
        </button>
    `).join('');

    const htmlContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-crimson text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">Class ${classNum}th Live Test</span>
            <h2 class="text-base font-black text-slate-900">विषयों की सूची (Subjects)</h2>
            <p class="text-[11px] text-slate-500 font-bold">लाइव टेस्ट देने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">
            ${subjectsHTML}
        </div>
    `;
    openDynamicPage(pageTitle, htmlContent);
}

function showComingSoonModal(subjectName) {
    const htmlContent = `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <h2 class="text-base font-black text-slate-900">${subjectName}</h2>
            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <p class="text-xs font-bold text-amber-900">जल्द ही अपलोड किया जाएगा!</p>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">इस विषय के मॉडल सेट्स और लाइव टेस्ट पर काम चल रहा है, बहुत जल्द उपलब्ध होंगे।</p>
            <button onclick="goBackModalStep()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">
                वापस जाएं (Back)
            </button>
        </div>
    `;
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
        </div>
    `;
    openDynamicPage("PYQ Question Bank", htmlContent, true);
}

// ==========================================
// 3. MATH MODEL SET QUIZ ENGINE
// ==========================================
const testData = {
    title: "BSEB 9th Mathematics Model Set 1",
    totalQuestions: 25,
    timeLimitMinutes: 30,
    questions: [
        { id: 1, question: "दो वास्तविक संख्याओं के बीच कितनी वास्तविक संख्याएँ होती हैं?", options: ["एक", "तीन", "पाँच", "अनगिनत"], answer: 3 },
        { id: 2, question: "निम्नांकित में कौन एक अपरिमेय संख्या है?", options: ["√(4/9)", "√12 / √3", "√7", "√81"], answer: 2 },
        { id: 3, question: "32²ᐟ⁵ का मान क्या होगा—", options: ["4", "2", "8", "16"], answer: 0 },
        { id: 4, question: "2√3 + √3 = ?", options: ["2√6", "6", "3√3", "4√6"], answer: 2 },
        { id: 5, question: "यदि x = 2 + √3, तो 1/x = ?", options: ["2 + 1/√3", "1/(2 - √3)", "1/2 + √3", "2 - √3"], answer: 3 },
        { id: 6, question: "2x² + 3x³ + 4 एक .......... बहुपद है।", options: ["एकघाती", "द्विघाती", "त्रिघाती", "शून्य घात वाला"], answer: 2 },
        { id: 7, question: "यदि P(x) = x − 1, q(x) = x + 1, तो P(x) · q(x) = ?", options: ["x² − 1", "2x", "−2", "x³ − 1"], answer: 0 },
        { id: 8, question: "बहुपद x² − mx + 2, x − 1 से पूर्णतः विभाजित होगा यदि m = ?", options: ["3", "2", "−3", "−2"], answer: 0 },
        { id: 9, question: "यदि P(x) = x − 1, तो [P(−1) + P(1)] / 2 = ?", options: ["−2", "−3/2", "−1", "0"], answer: 2 },
        { id: 10, question: "बहुपद P(x) = (x + 2)³ में x² का गुणांक है—", options: ["3", "6", "12", "8"], answer: 1 },
        { id: 11, question: "249² − 248² = ?", options: ["1²", "477", "487", "497"], answer: 3 },
        { id: 12, question: "यदि x² + kx + 6 = (x + 2)(x + 3), तो k = ?", options: ["5", "6", "1", "0"], answer: 0 },
        { id: 13, question: "द्विघात बहुपद में पदों की अधिकतम संख्या होगी—", options: ["0", "1", "2", "3"], answer: 3 },
        { id: 14, question: "x-अक्ष पर सभी बिंदुओं के लिए कोटि होगी—", options: ["0", "1", "−1", "कोई नहीं"], answer: 0 },
        { id: 15, question: "वह बिंदु जहाँ दोनों अक्ष मिलते हैं, कहलाता है—", options: ["शून्य", "कोटि", "मूल बिंदु", "चतुर्थांश"], answer: 2 },
        { id: 16, question: "एक बिंदु का भुज हमेशा धनात्मक किस चतुर्थांश में होगा—", options: ["I और II", "I और IV", "केवल I", "केवल II"], answer: 1 },
        { id: 17, question: "यदि बिंदु (2, 3) रैखिक समीकरण ax + 3y = 11 के आलेख पर स्थित हैं, तो a = ?", options: ["1", "−1", "2", "−2"], answer: 0 },
        { id: 18, question: "रैखिक समीकरण 3x − 2y = 1 के कितने हल हैं?", options: ["एक", "दो", "तीन", "अनगिनत"], answer: 3 },
        { id: 19, question: "समीकरण x = 6 को दो चरोंवाले समीकरण के रूप में लिखेंगे—", options: ["1 · x + 1 · y = 6", "1 · x + 0 · y = 6", "0 · x + 1 · y = 6", "0 · x + 0 · y = 6"], answer: 1 },
        { id: 20, question: "दो रेखाएँ समांतर होंगी यदि उनमें—", options: ["एक उभयनिष्ठ बिंदु हो", "दो उभयनिष्ठ बिंदु हो", "कोई उभयनिष्ठ बिंदु न हो", "इनमें कोई नहीं"], answer: 2 },
        { id: 21, question: "बिंदु (−3, −4) किस चतुर्थांश में स्थित है?", options: ["I", "II", "III", "IV"], answer: 2 },
        { id: 22, question: "दिए गए चित्र में, x = ?", options: ["50°", "60°", "40°", "55°"], answer: 2 },
        { id: 23, question: "यदि एक त्रिभुज के कोण (x − 10°), (2x + 10°) एवं 6x हैं, तो x = ?", options: ["40°", "30°", "20°", "90°"], answer: 2 },
        { id: 24, question: "यदि ΔABC में AB = AC तथा ∠B = 80°, तो ∠C = ?", options: ["50°", "40°", "130°", "80°"], answer: 3 },
        { id: 25, question: "ΔPQR में सत्य है—", options: ["PQ = QR", "PQ > QR", "PQ + QR > PR", "कोई नहीं"], answer: 2 }
    ]
};

window.startBSEB9thMathTest = function() {
    const savedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (savedProgress) {
        const confirmResume = confirm("आपने पहले यह टेस्ट अधूरा छोड़ा था। क्या आप वहीं से शुरू (Resume) करना चाहते हैं?");
        if (confirmResume) {
            const data = JSON.parse(savedProgress);
            currentQuestionIndex = data.currentQuestionIndex || 0;
            userAnswers = data.userAnswers || new Array(25).fill(null);
            visitedQuestions = data.visitedQuestions || new Array(25).fill(false);
            timeRemaining = data.timeRemaining || 30 * 60;
        } else {
            localStorage.removeItem(STORAGE_KEY_PROGRESS);
            resetTestData();
        }
    } else {
        resetTestData();
    }

    renderQuizUI();
    renderQuestion(currentQuestionIndex);
    startTimer();
};

function resetTestData() {
    currentQuestionIndex = 0;
    userAnswers.fill(null);
    visitedQuestions.fill(false);
    visitedQuestions[0] = true;
    timeRemaining = 30 * 60;
}

function autoSaveProgress() {
    const progressData = { currentQuestionIndex, userAnswers, visitedQuestions, timeRemaining };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressData));
}

function renderQuizUI() {
    const testUIHTML = `
        <div class="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-md mb-2">
            <div>
                <h2 class="text-xs font-black text-rose-400">${testData.title}</h2>
                <p class="text-[10px] text-slate-400 font-bold">25 Questions • Live Test</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="pauseQuiz()" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center space-x-1">
                    <i data-lucide="pause" class="w-3 h-3 fill-current"></i>
                    <span>Pause</span>
                </button>
                <div class="bg-slate-800 px-3 py-1 rounded-xl border border-rose-500/30 flex items-center space-x-1 text-rose-400 font-mono text-xs font-bold">
                    <i data-lucide="timer" class="w-3.5 h-3.5"></i>
                    <span id="quiz-timer">30:00</span>
                </div>
            </div>
        </div>

        <div id="quiz-question-card" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span id="q-badge" class="bg-rose-100 text-crimson text-[10px] font-black px-2.5 py-0.5 rounded-full">Question 1 of 25</span>
                <span class="text-[10px] text-slate-400 font-bold">+1 Mark</span>
            </div>
            <h3 id="q-text" class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pt-1"></h3>
            <div id="q-options" class="space-y-2 pt-1"></div>
        </div>

        <div class="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <button id="prev-btn" onclick="navigateQuestion(-1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40">Previous</button>
            <button onclick="clearChoice()" class="text-[11px] text-rose-600 font-bold hover:underline">Clear Choice</button>
            <button id="next-btn" onclick="navigateQuestion(1)" class="bg-crimson hover:bg-rose-900 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Next</button>
        </div>

        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
                <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-wider">Question Palette</h4>
                <span class="text-[10px] text-slate-400">Tap to jump</span>
            </div>
            <div id="question-palette" class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
            <button onclick="submitFinalQuiz()" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all">SUBMIT TEST NOW</button>
        </div>
    `;

    openDynamicPage("Live Mathematics Test Engine", testUIHTML, true);
}

window.renderQuestion = function(index) {
    const q = testData.questions[index];
    visitedQuestions[index] = true;
    autoSaveProgress();

    document.getElementById("q-badge").innerText = `Question ${index + 1} of 25`;
    document.getElementById("q-text").innerHTML = q.question;

    const container = document.getElementById("q-options");
    container.innerHTML = q.options.map((opt, optIdx) => `
        <label onclick="selectOption(${index}, ${optIdx})" class="flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
            userAnswers[index] === optIdx 
            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black shadow-xs ring-1 ring-emerald-500'
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
        }">
            <input type="radio" name="opt" ${userAnswers[index] === optIdx ? 'checked' : ''} class="accent-emerald-600 w-4 h-4">
            <span class="text-xs sm:text-sm">${String.fromCharCode(65 + optIdx)}) ${opt}</span>
        </label>
    `).join('');

    document.getElementById("prev-btn").disabled = (index === 0);
    renderPalette();
};

window.selectOption = function(qIdx, optIdx) {
    userAnswers[qIdx] = optIdx;
    renderQuestion(qIdx);
};

window.clearChoice = function() {
    userAnswers[currentQuestionIndex] = null;
    renderQuestion(currentQuestionIndex);
};

window.navigateQuestion = function(step) {
    currentQuestionIndex += step;
    if (currentQuestionIndex < 0) currentQuestionIndex = 0;
    if (currentQuestionIndex >= 25) currentQuestionIndex = 24;
    renderQuestion(currentQuestionIndex);
};

window.jumpToQuestion = function(index) {
    currentQuestionIndex = index;
    renderQuestion(index);
};

window.renderPalette = function() {
    const palette = document.getElementById("question-palette");
    palette.innerHTML = testData.questions.map((_, idx) => {
        let btnStatusClass = "bg-slate-100 text-slate-600 border-slate-200";
        if (userAnswers[idx] !== null) btnStatusClass = "bg-emerald-500 text-white border-emerald-600 font-black";
        else if (visitedQuestions[idx]) btnStatusClass = "bg-amber-500 text-white border-amber-600";
        if (idx === currentQuestionIndex) btnStatusClass += " ring-2 ring-rose-600 ring-offset-1";

        return `<button onclick="jumpToQuestion(${idx})" class="w-8 h-8 text-[11px] rounded-lg font-bold border flex items-center justify-center transition-all ${btnStatusClass}">${idx + 1}</button>`;
    }).join('');
};

window.pauseQuiz = function() {
    if (timerInterval) clearInterval(timerInterval);
    autoSaveProgress();
    alert("आपका टेस्ट पॉज़ (Pause) कर दिया गया है।");
    closeDynamicPage();
};

window.startTimer = function() {
    if (timerInterval) clearInterval(timerInterval);
    const timerElem = document.getElementById("quiz-timer");

    timerInterval = setInterval(() => {
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        if (timerElem) {
            timerElem.innerText = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        if (--timeRemaining < 0) {
            clearInterval(timerInterval);
            alert("समय समाप्त! टेस्ट ऑटो-सबमिट हो गया है।");
            submitFinalQuiz();
        }
    }, 1000);
};

window.submitFinalQuiz = function() {
    if (timerInterval) clearInterval(timerInterval);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    testData.questions.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const isCorrect = (userAns === q.answer);
        
        if (userAns === null) unattemptedCount++;
        else if (isCorrect) { score++; correctCount++; }
        else wrongCount++;
    });

    const scoreHTML = `
        <div class="bg-white p-5 rounded-3xl border border-rose-100 shadow-xl text-center space-y-4 my-auto">
            <div class="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">✓</div>
            <h2 class="text-lg font-black text-slate-900">Test Result Summary</h2>
            <p class="text-xs text-slate-500 font-bold">${testData.title}</p>
            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-0.5">
                <div class="text-3xl font-black text-emerald-700">${score} / 25</div>
                <div class="text-[11px] font-bold text-slate-600">Total Score (${((score / 25) * 100).toFixed(1)}%)</div>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">
                <div class="bg-emerald-50 text-emerald-700 p-2 rounded-xl border border-emerald-200">Sahi: ${correctCount}</div>
                <div class="bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-200">Galat: ${wrongCount}</div>
                <div class="bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200">Chhode: ${unattemptedCount}</div>
            </div>
            <button onclick="closeDynamicPage()" class="w-full bg-crimson text-white font-black py-3 rounded-xl shadow-md text-xs active:scale-95 transition-transform">Finish & Close</button>
        </div>
    `;
    openDynamicPage("Scorecard Result", scoreHTML, true);
};

// ==========================================
// 4. CLASS 9TH SCIENCE CHAPTER 1 PRACTICE TEST ENGINE
// ==========================================
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

const class9ScienceCh1Data = {
    title: "अध्याय 1: हमारे आस-पास के पदार्थ (Practice Test)",
    totalQuestions: 20,
    questions: [
        {
            id: 1,
            question: "1. निम्नलिखित में से कौन-सा पदार्थ है?",
            options: ["स्नेह", "हवा", "नफरत", "विचार"],
            answer: 1,
            explanation: "हवा का एक निश्चित द्रव्यमान होता है और यह स्थान घेरती है, इसलिए यह एक पदार्थ है। स्नेह, नफरत और विचार केवल भावनाएं हैं।"
        },
        {
            id: 2,
            question: "2. पदार्थ के कणों के बीच क्या होता है?",
            options: ["केवल आकर्षण बल", "केवल प्रतिकर्षण बल", "रिक्त स्थान (अंतरआणविक स्थान)", "कोई स्थान नहीं होता"],
            answer: 2,
            explanation: "पदार्थ के कणों के बीच सूक्ष्म रिक्त स्थान होता है, जिसे अंतरआणविक स्थान (Intermolecular space) कहते हैं।"
        },
        {
            id: 3,
            question: "3. जिस ताप पर ठोस पिघलकर द्रव बन जाता है, वह क्या कहलाता है?",
            options: ["क्वथनांक (Boiling point)", "गलनांक (Melting point)", "संघनन (Condensation)", "हिमांक (Freezing point)"],
            answer: 1,
            explanation: "जिस नियत तापमान पर कोई ठोस पदार्थ अवस्था परिवर्तन करके द्रव में बदलता है, उसे उस पदार्थ का गलनांक कहते हैं।"
        },
        {
            id: 4,
            question: "4. पानी का क्वथनांक (Boiling point) केल्विन पैमाने पर कितना होता है?",
            options: ["273 K", "373 K", "100 K", "0 K"],
            answer: 1,
            explanation: "पानी 100°C पर उबलता है। केल्विन में बदलने के लिए 100 + 273 = 373 K होता है।"
        },
        {
            id: 5,
            question: "5. 25°C को केल्विन पैमाने पर बदलने पर मान होगा—",
            options: ["298 K", "273 K", "300 K", "250 K"],
            answer: 0,
            explanation: "K = °C + 273 => 25 + 273 = 298 K।"
        },
        {
            id: 6,
            question: "6. द्रव से गैस में बदलने की प्रक्रिया को क्या कहते हैं?",
            options: ["वाष्पीकरण (Evaporation/Vaporization)", "ऊर्ध्वपातन (Sublimation)", "संघनन (Condensation)", "जमुना (Freezing)"],
            answer: 0,
            explanation: "किसी द्रव का उसकी गैस अवस्था में परिवर्तित होना वाष्पीकरण या वाष्पन कहलाता है।"
        },
        {
            id: 7,
            question: "7. निम्नलिखित में से किसमें ऊर्ध्वपातन (Sublimation) का गुण पाया जाता है?",
            options: ["नमक", "कपूर (Camphor)", "चीनी", "जल"],
            answer: 1,
            explanation: "कपूर बिना द्रव अवस्था में बदले सीधे ठोस से गैस बन जाता है, इसे ऊर्ध्वपातन कहते हैं।"
        },
        {
            id: 8,
            question: "8. गर्मियों के दिनों में सूती कपड़े पहनने की सलाह क्यों दी जाती है?",
            options: [
                "यह पसीने को सोखकर वाष्पीकरण में मदद करता है जिससे ठंडक मिलती है",
                "यह कपड़ा बहुत भारी होता है",
                "यह गर्मी को रोकता है",
                "इसमें से हवा पार नहीं होती"
            ],
            answer: 0,
            explanation: "सूती कपड़ा पसीना सोखता है। पसीने के वाष्पीकरण के दौरान शरीर से गुप्त ऊष्मा निकलती है, जिससे ठंडक का अहसास होता है।"
        },
        {
            id: 9,
            question: "9. गैसों में विसरण (Diffusion) की दर ठोसों और द्रवों की तुलना में होती है—",
            options: ["बहुत कम", "बराबर", "बहुत अधिक", "शून्य"],
            answer: 2,
            explanation: "गैस के कणों की गतिज ऊर्जा अधिक होती है और उनके बीच का स्थान बहुत अधिक होता है, इसलिए गैसों का विसरण सबसे तेज़ होता है।"
        },
        {
            id: 10,
            question: "10. ठोस कार्बन डाइऑक्साइड (CO₂) को किस नाम से जाना जाता है?",
            options: ["शुष्क बर्फ (Dry Ice)", "भारी जल", "सादा बर्फ", "तरल गैस"],
            answer: 0,
            explanation: "उच्च दाब पर भंडारित ठोस CO₂ को शुष्क बर्फ (Dry Ice) कहा जाता है क्योंकि यह पिघले बिना सीधे गैस बनती है।"
        },
        {
            id: 11,
            question: "11. वाष्पीकरण की दर किस पर निर्भर करती है?",
            options: ["सतह के क्षेत्रफल पर", "तापमान पर", "आर्द्रता और वायु की गति पर", "उपर्युक्त सभी पर"],
            answer: 3,
            explanation: "सतह का क्षेत्र, तापमान और हवा की गति बढ़ने पर वाष्पीकरण बढ़ता है, जबकि आर्द्रता बढ़ने पर यह घटता है।"
        },
        {
            id: 12,
            question: "12. सीधे ठोस से गैस बनने की क्रिया को क्या कहते हैं?",
            options: ["वाष्पन", "ऊर्ध्वपातन (Sublimation)", "गलन", "संघनन"],
            answer: 1,
            explanation: "बिना द्रव अवस्था में बदले ठोस का सीधे गैस में बदलना ऊर्ध्वपातन कहलाता है।"
        },
        {
            id: 13,
            question: "13. आर्द्रता (Humidity) बढ़ने पर वाष्पीकरण की दर पर क्या प्रभाव पड़ता है?",
            options: ["बढ़ती है", "घटती है", "कोई बदलाव नहीं होता", "पहले बढ़ती है फिर घटती है"],
            answer: 1,
            explanation: "हवा में पहले से जलवाष्प मौजूद होने (आर्द्रता) के कारण वाष्पीकरण की दर कम हो जाती है।"
        },
        {
            id: 14,
            question: "14. मटके (घड़े) का पानी गर्मियों में ठंडा क्यों रहता है?",
            options: ["विसरण के कारण", "वाष्पीकरण के कारण", "संघनन के कारण", "अवशोषण के कारण"],
            answer: 1,
            explanation: "मिट्टी के मटके के सूक्ष्म छिद्रों से पानी बाहर आता रहता है और वाष्प बनता है। वाष्पीकरण के लिए ऊष्मा मटके के पानी से ली जाती है, जिससे पानी ठंडा होता है।"
        },
        {
            id: 15,
            question: "15. SI मात्रक प्रणाली में दाब (Pressure) का मात्रक क्या है?",
            options: ["पास्कल (Pascal)", "न्यूटन", "केल्विन", "किलोग्राम"],
            answer: 0,
            explanation: "दाब का SI मात्रक पास्कल (Pa) होता है।"
        },
        {
            id: 16,
            question: "16. पदार्थ की किस अवस्था में कणों के बीच सबसे मजबूत आकर्षण बल होता है?",
            options: ["ठोस (Solid)", "द्रव (Liquid)", "गैस (Gas)", "प्लाज्मा (Plasma)"],
            answer: 0,
            explanation: "ठोस अवस्था में कण बहुत पास-पास होते हैं, इसलिए उनके बीच का अंतराणुक आकर्षण बल सबसे अधिक होता है।"
        },
        {
            id: 17,
            question: "17. गुप्त ऊष्मा (Latent Heat) का क्या अर्थ है?",
            options: [
                "छुपी हुई ऊष्मा जो तापमान बदले बिना अवस्था परिवर्तन करती है",
                "बहुत तेज गर्मी",
                "ठंडी ऊष्मा",
                "प्रकाश ऊर्जा"
            ],
            answer: 0,
            explanation: "अवस्था परिवर्तन के दौरान जो ऊष्मा बिना तापमान बढ़ाए कणों के बीच के आकर्षण बल को तोड़ने में खर्च होती है, उसे गुप्त ऊष्मा कहते हैं।"
        },
        {
            id: 18,
            question: "18. गैस का द्रव में बदलना क्या कहलाता है?",
            options: ["संघनन (Condensation)", "जमुना (Freezing)", "वाष्पीकरण", "पिघलना"],
            answer: 0,
            explanation: "गैस के ठंडा होकर द्रव अवस्था में बदलने की प्रक्रिया को संघनन कहते हैं।"
        },
        {
            id: 19,
            question: "19. पदार्थ की चौथी अवस्था (4th state of matter) किसे माना गया है?",
            options: ["प्लाज्मा (Plasma)", "बोसे-आइंस्टीन कंडेन्सेट", "गैस", "द्रव"],
            answer: 0,
            explanation: "पदार्थ की पहली 3 अवस्थाएं (ठोस, द्रव, गैस) हैं और चौथी अवस्था 'प्लाज्मा' है, जो अत्यधिक ऊर्जा वाले आयनीकृत गैस के कणों से बनी होती है।"
        },
        {
            id: 20,
            question: "20. निम्नलिखित में से किसकी संपीड्यता (Compressibility) सबसे अधिक होती है?",
            options: ["लोहे की छड़", "जल", "ऑक्सीजन गैस", "लकड़ी"],
            answer: 2,
            explanation: "गैसों के कणों के बीच बहुत अधिक रिक्त स्थान होता है, इसलिए गैसों को आसानी से दबाया (संपीडित) जा सकता है।"
        }
    ]
};

function renderClass9Ch1PracticeTest() {
    let questionsHTML = class9ScienceCh1Data.questions.map((q, qIdx) => {
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
                <button 
                    onclick="handleCh1OptionSelect(${qIdx}, ${optIdx})" 
                    ${isAnswered ? 'disabled' : ''} 
                    class="w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between ${btnStyle}">
                    <span>${String.fromCharCode(65 + optIdx)}) ${opt}</span>
                    ${isAnswered && optIdx === q.answer ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-none"></i>' : ''}
                    ${isAnswered && selectedOpt === optIdx && selectedOpt !== q.answer ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-600 flex-none"></i>' : ''}
                </button>
            `;
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
                        <span class="font-black text-slate-900">व्याख्या (Explanation):</span> ${q.explanation}
                    </p>
                </div>
            `;
        }

        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 mb-4">
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">${q.question}</h3>
                <div class="space-y-2">
                    ${optionsHTML}
                </div>
                ${explanationHTML}
            </div>
        `;
    }).join('');

    const pageContent = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">Chapterwise Live Practice</span>
            <h2 class="text-base font-black text-slate-900">${class9ScienceCh1Data.title}</h2>
            <p class="text-[11px] text-slate-500 font-bold">सही विकल्प चुनें और उत्तर के साथ व्याख्या तुरंत देखें:</p>
        </div>
        <div>
            ${questionsHTML}
        </div>
    `;

    openDynamicPage("Chapter 1: हमारे आस-पास के पदार्थ", pageContent);
}

window.handleCh1OptionSelect = function(questionIndex, optionIndex) {
    currentCh1Answers[questionIndex] = optionIndex;
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
        </button>
    `).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-sky-100 text-accentBlue text-[10px] font-black px-2.5 py-0.5 rounded-full">Class 9th Science</span>
            <h2 class="text-base font-black text-slate-900">विषय सूची (Chapter List)</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रैक्टिस करने के लिए किसी भी अध्याय पर क्लिक करें:</p>
        </div>
        <div class="space-y-2">
            ${chaptersHTML}
        </div>
    `;
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
        </div>
    `;
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
        </button>
    `).join("");

    const pageHTML = `
        <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1 mb-3">
            <span class="bg-rose-100 text-crimson text-[10px] font-black px-2.5 py-0.5 rounded-full">${className}</span>
            <h2 class="text-base font-black text-slate-900">${className} विषयों की सूची</h2>
            <p class="text-[11px] text-slate-500 font-bold">प्रैक्टिस शुरू करने के लिए विषय चुनें:</p>
        </div>
        <div class="space-y-2">
            ${listHTML}
        </div>
    `;
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
        </div>
    `;
    openDynamicPage("Practice Set", htmlContent);
}

// ==========================================
// 5. MAIN APPLICATION INITIALIZATION & DOM EVENTS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    if (window.lucide) lucide.createIcons();

    const sideMenuOverlay = document.getElementById("side-menu-overlay");
    const sideMenuContent = document.getElementById("side-menu-content");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    
    const dynamicViewModal = document.getElementById("dynamic-view-modal");
    const dynamicViewTitle = document.getElementById("dynamic-view-title");
    const dynamicViewBody = document.getElementById("dynamic-view-body");
    const closeViewBtn = document.getElementById("close-view-btn");

    const toastMessage = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");

    function showToast(message) {
        if (!toastMessage || !toastText) {
            alert(message);
            return;
        }
        toastText.innerText = message;
        toastMessage.classList.remove("hidden");
        setTimeout(() => toastMessage.classList.add("hidden"), 2500);
    }

    window.openDynamicPage = function(title, htmlContent, isNewFlow = false) {
        if (isNewFlow) {
            modalHistory = [];
        }

        modalHistory.push({ title, htmlContent });
        renderCurrentModalState();
    };

    function renderCurrentModalState() {
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
        if (timerInterval) clearInterval(timerInterval);
        modalHistory = [];
        if (dynamicViewModal) {
            dynamicViewModal.classList.add("hidden");
            dynamicViewModal.classList.remove("flex");
        }
    };

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

    // MAIN CLICK EVENT DELEGATION FOR CLICK ACTIONS
    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if (!target) return;

        const action = target.getAttribute("data-action");

        // Ribbon & Menu Portals
        if (action === "toggle-menu" || action === "open-menu") {
            openSideMenu();
        }
        else if (action === "quick-model-sets" || action === "open-model-sets") {
            openModelSetsPortal();
        }
        else if (action === "quick-tests" || action === "open-tests") {
            openTestsPortal();
        }
        else if (action === "quick-pyq" || action === "open-pyq") {
            openPYQPortal();
        }

        // Model Sets Actions
        else if (action === "open-10th-model-subjects") {
            renderModelSubjects(10);
        }
        else if (action === "open-9th-model-subjects") {
            renderModelSubjects(9);
        }

        // Live Test Actions
        else if (action === "open-10th-test-subjects") {
            renderTestSubjects(10);
        }
        else if (action === "open-9th-test-subjects") {
            renderTestSubjects(9);
        }

        // Chapterwise Practice Portal Actions
        else if (action === "open-chapterwise-practice") {
            openChapterwisePracticePortal();
        }
        else if (action === "open-9th-chapterwise-subjects") {
            renderChapterwiseSubjects("Class 9th", true);
        }
        else if (action === "open-10th-chapterwise-subjects") {
            renderChapterwiseSubjects("Class 10th", false);
        }
        else if (action === "open-9th-science-chapters") {
            openClass9ScienceChapters();
        }
        
        // Dynamic Chapter Quiz Trigger Action (CORRECTED LOCATION)
        else if (action === "open-chapter-quiz") {
            const chapId = target.getAttribute("data-chapter-id");
            if (chapId === "1") {
                currentCh1Answers = new Array(20).fill(null); // Reset Test State
                renderClass9Ch1PracticeTest();
            } else {
                const chapName = target.getAttribute("data-chapter-name");
                openChapterQuizPlaceholder(chapName);
            }
        }

        // Miscellaneous Actions
        else if (action === "open-coming-soon-subject") {
            const subjectName = target.getAttribute("data-subject");
            showComingSoonModal(subjectName);
        }
        else if (action === "buy-book") {
            const bookId = target.getAttribute("data-book-id");
            window.open(`https://wa.me/919128919447?text=Hi%20Raj%20Sir,%20I%20want%20to%20order%20Book%20ID:%20${bookId}`, "_blank");
        }
        else if (action === "coming-soon") {
            showToast("बहुत ही जल्द यह सुविधा चालू होगी!");
        }
        else if (action === "subject-coming-soon") {
            showToast("यह विषय बहुत जल्द अपलोड किया जाएगा!");
        }
        else if (action === "open-9th-math-test") {
            startBSEB9thMathTest();
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