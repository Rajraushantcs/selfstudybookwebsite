// SelfStudyBook.com - Main Application JavaScript
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Elements Selection
    const sideMenuOverlay = document.getElementById("side-menu-overlay");
    const sideMenuContent = document.getElementById("side-menu-content");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    
    const dynamicViewModal = document.getElementById("dynamic-view-modal");
    const dynamicViewTitle = document.getElementById("dynamic-view-title");
    const dynamicViewBody = document.getElementById("dynamic-view-body");
    const closeViewBtn = document.getElementById("close-view-btn");

    const toastMessage = document.getElementById("toast-message");
    const toastText = document.getElementById("toast-text");

    // Helper: Show Toast Message
    function showToast(message) {
        toastText.innerText = message;
        toastMessage.classList.remove("hidden");
        setTimeout(() => {
            toastMessage.classList.add("hidden");
        }, 2500);
    }

    // Helper: Open Side Menu Drawer
    function openSideMenu() {
        sideMenuOverlay.classList.remove("hidden");
        setTimeout(() => {
            sideMenuContent.classList.remove("-translate-x-full");
        }, 10);
    }

    // Helper: Close Side Menu Drawer
    function closeSideMenu() {
        sideMenuContent.classList.add("-translate-x-full");
        setTimeout(() => {
            sideMenuOverlay.classList.add("hidden");
        }, 300);
    }

    // Helper: Open Dynamic View Page
    function openDynamicPage(title, htmlContent) {
        dynamicViewTitle.innerText = title;
        dynamicViewBody.innerHTML = htmlContent;
        dynamicViewModal.classList.remove("hidden");
        dynamicViewModal.classList.add("flex");
        window.scrollTo(0, 0);
        
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // Helper: Close Dynamic View Page
    function closeDynamicPage() {
        dynamicViewModal.classList.add("hidden");
        dynamicViewModal.classList.remove("flex");
    }

    // ==========================================
    // CLICK EVENT LISTENERS
    // ==========================================

    document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if (!target) return;

        const action = target.getAttribute("data-action");

        // 1. Toggle Side Menu Drawer
        if (action === "toggle-menu") {
            openSideMenu();
        }

        // 2. Coming Soon Action for Future Features
        else if (action === "coming-soon" || action === "quick-test") {
            showToast("बहुत ही जल्द यह सुविधा चालू होगी! (Coming Soon)");
        }

        // 3. Order Book Action -> WhatsApp Direct
        else if (action === "buy-book") {
            const bookId = target.getAttribute("data-book-id");
            let msg = "Hi Raj Sir, I want to order Self Study Book.";
            if (bookId === "10") msg = "Hi Raj Sir, I want to order Class 10th Self Study Book.";
            if (bookId === "9") msg = "Hi Raj Sir, I want to order Class 9th Self Study Book.";
            if (bookId === "gk") msg = "Hi Raj Sir, I want to order Manoranjan GK Book.";
            
            window.open(`https://wa.me/919128919447?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // 4. E-BOOKS Page Action
        else if (action === "quick-ebooks") {
            e.preventDefault();
            const ebookPageHTML = `
                <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-3">
                    <span class="bg-rose-50 text-crimson text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Digital E-Library</span>
                    <h2 class="text-base font-black text-slate-900">E-Books संग्रह (PDF Store)</h2>
                    <p class="text-xs text-slate-500">अपनी पसंदीदा ई-बुक्स डिजिटल फॉर्मेट में डाउनलोड करें और कहीं भी पढ़ें।</p>
                </div>

                <div class="space-y-3">
                    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <div>
                            <h4 class="text-xs font-bold text-slate-900">Class 10th All Subject E-Book Set</h4>
                            <p class="text-[10px] text-slate-500">Comprehensive PDF Guide • Latest Pattern</p>
                        </div>
                        <button class="bg-crimson text-white px-3 py-1.5 rounded-xl text-[10px] font-black" data-action="coming-soon">Explore</button>
                    </div>

                    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <div>
                            <h4 class="text-xs font-bold text-slate-900">Class 9th Quick Revision PDF Package</h4>
                            <p class="text-[10px] text-slate-500">Short Notes & Quick Formulas</p>
                        </div>
                        <button class="bg-crimson text-white px-3 py-1.5 rounded-xl text-[10px] font-black" data-action="coming-soon">Explore</button>
                    </div>
                </div>
            `;
            openDynamicPage("E-Books Store", ebookPageHTML);
        }

        // 5. NOTES Page Action
        else if (action === "quick-notes") {
            e.preventDefault();
            const notesPageHTML = `
                <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-3">
                    <span class="bg-sky-50 text-accentBlue text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Handwritten & Class Notes</span>
                    <h2 class="text-base font-black text-slate-900">राज सर के स्पेशल नोट्स</h2>
                    <p class="text-xs text-slate-500">बिहार बोर्ड परीक्षा के लिए तैयार किए गए सबसे आसान नोट्स।</p>
                </div>

                <div class="space-y-3">
                    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <span class="text-xs font-bold text-slate-800">विज्ञान (Science) हस्तलिखित नोट्स</span>
                        <button class="bg-accentBlue text-white px-3 py-1.5 rounded-xl text-[10px] font-black" data-action="coming-soon">View Notes</button>
                    </div>
                    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <span class="text-xs font-bold text-slate-800">गणित (Maths) Formula Sheet</span>
                        <button class="bg-accentBlue text-white px-3 py-1.5 rounded-xl text-[10px] font-black" data-action="coming-soon">View Notes</button>
                    </div>
                </div>
            `;
            openDynamicPage("Class Notes", notesPageHTML);
        }

        // 6. ORDER BOOKS Page Action
        else if (action === "open-order-books-page") {
            e.preventDefault();
            const orderBooksHTML = `
                <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2">
                    <h2 class="text-base font-black text-slate-900">ऑर्डर करें - राज रौशन सर की पुस्तकें</h2>
                    <p class="text-xs text-slate-500">घर बैठे डिलीवर करवाएं सबसे भरोसेमंद गाइड बुक्स।</p>
                </div>

                <div class="space-y-3">
                    <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex space-x-3 items-center">
                        <div class="w-16 h-20 bg-rose-100 rounded-lg flex items-center justify-center font-bold text-xs text-crimson">10th</div>
                        <div class="flex-1">
                            <h4 class="text-xs font-bold text-slate-900">Class 10th Objective + Subjective</h4>
                            <p class="text-[10px] text-slate-500">Complete BSEB Exam Kit</p>
                            <button class="mt-2 bg-crimson text-white px-3 py-1 rounded-lg text-[10px] font-black" data-action="buy-book" data-book-id="10">Order Now</button>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex space-x-3 items-center">
                        <div class="w-16 h-20 bg-sky-100 rounded-lg flex items-center justify-center font-bold text-xs text-accentBlue">9th</div>
                        <div class="flex-1">
                            <h4 class="text-xs font-bold text-slate-900">Class 9th Complete Study Guide</h4>
                            <p class="text-[10px] text-slate-500">Full Chapterwise Solutions</p>
                            <button class="mt-2 bg-crimson text-white px-3 py-1 rounded-lg text-[10px] font-black" data-action="buy-book" data-book-id="9">Order Now</button>
                        </div>
                    </div>
                </div>
            `;
            openDynamicPage("Order Books Online", orderBooksHTML);
        }

        // 7. PYQ DOWNLOAD Page Action
        else if (action === "open-pyq-page") {
            e.preventDefault();
            const pyqPageHTML = `
                <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2">
                    <h2 class="text-base font-black text-slate-900">Previous Year Questions (PYQ) Archive</h2>
                    <p class="text-xs text-slate-500">अपनी परीक्षा के वर्ष के अनुसार पिछले वर्षों के प्रश्न पत्र देखें और डाउनलोड करें:</p>
                </div>

                <!-- Year Buttons Grid -->
                <div class="grid grid-cols-3 gap-2">
                    ${[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(year => `
                        <button class="pyq-year-btn bg-white hover:bg-rose-50 text-crimson border border-rose-200 p-3 rounded-2xl font-black text-xs text-center shadow-sm active:scale-95 transition-transform" data-year="${year}">
                            <div class="text-[9px] text-slate-400 uppercase font-bold">YEAR</div>
                            <div class="text-base font-black">${year}</div>
                        </button>
                    `).join("")}
                </div>

                <div id="pyq-year-content" class="bg-white p-4 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-bold">
                    ऊपर से कोई भी वर्ष (Year) चुनें जिस वर्ष का PYQ आप देखना चाहते हैं।
                </div>
            `;
            openDynamicPage("PYQ Question Papers", pyqPageHTML);
        }
    });

    // Close Menu Event Listener
    if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSideMenu);

    // Close Side Menu on backdrop click
    if (sideMenuOverlay) {
        sideMenuOverlay.addEventListener("click", (e) => {
            if (e.target === sideMenuOverlay) closeSideMenu();
        });
    }

    // Close Dynamic Page Event
    if (closeViewBtn) closeViewBtn.addEventListener("click", closeDynamicPage);

    // Handle Nav Items inside Drawer Menu
    document.querySelectorAll(".menu-nav-item").forEach(item => {
        item.addEventListener("click", () => {
            closeSideMenu();
            setTimeout(() => {
                showToast("बहुत ही जल्द यह सुविधा चालू होगी! (Coming Soon)");
            }, 300);
        });
    });

    // Event Delegation for Dynamic PYQ Year Buttons
    document.addEventListener("click", (e) => {
        const yearBtn = e.target.closest(".pyq-year-btn");
        if (yearBtn) {
            const selectedYear = yearBtn.getAttribute("data-year");
            const contentBox = document.getElementById("pyq-year-content");
            if (contentBox) {
                contentBox.innerHTML = `
                    <div class="text-left space-y-2">
                        <h4 class="text-xs font-black text-crimson border-b border-rose-100 pb-2">BSEB Class 10th - ${selectedYear} Question Papers</h4>
                        <div class="flex items-center justify-between py-1">
                            <span class="text-xs text-slate-800 font-bold">विज्ञान (Science) ${selectedYear}</span>
                            <button class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-black" data-action="coming-soon">Download</button>
                        </div>
                        <div class="flex items-center justify-between py-1">
                            <span class="text-xs text-slate-800 font-bold">गणित (Mathematics) ${selectedYear}</span>
                            <button class="bg-sky-50 text-accentBlue border border-sky-200 px-2.5 py-1 rounded-lg text-[10px] font-black" data-action="coming-soon">Download</button>
                        </div>
                    </div>
                `;
            }
        }
    });
});