module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/app/components/intro-text.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IntroText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function IntroText({ texts }) {
    const [currentTextIndex, setCurrentTextIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [displayedText, setDisplayedText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isDeleting, setIsDeleting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [shouldScroll, setShouldScroll] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Calculate typing speed with easing curve - slower at start, faster as it goes
    const getTypingDelay = (charIndex, textLength)=>{
        const currentText = texts[currentTextIndex];
        if (!currentText) return 50;
        // Find first word boundary (first space)
        const firstSpaceIndex = currentText.indexOf(' ') !== -1 ? currentText.indexOf(' ') : textLength;
        // If we're in the first word, use slower speed with easing
        if (charIndex < firstSpaceIndex) {
            // Easing curve: start at 200ms, gradually decrease to 50ms
            const progress = charIndex / firstSpaceIndex;
            const easedProgress = progress * progress; // Quadratic easing
            return 200 - easedProgress * 150; // 200ms to 50ms
        }
        // After first word, use normal speed
        return 50;
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (texts.length === 0) return;
        const currentText = texts[currentTextIndex];
        if (!currentText) return;
        let timeout;
        const isLastText = currentTextIndex === texts.length - 1;
        if (isTyping && !isDeleting) {
            // Typing in: add letters one by one
            if (displayedText.length < currentText.length) {
                const delay = getTypingDelay(displayedText.length, currentText.length);
                timeout = setTimeout(()=>{
                    setDisplayedText(currentText.slice(0, displayedText.length + 1));
                }, delay);
            } else {
                // Finished typing
                if (isLastText) {
                    // Stay at the last text, don't delete
                    // Trigger scroll after 3 seconds
                    timeout = setTimeout(()=>{
                        setShouldScroll(true);
                    }, 3000);
                    return;
                } else {
                    // Wait 3 seconds then start deleting
                    timeout = setTimeout(()=>{
                        setIsTyping(false);
                        setIsDeleting(true);
                    }, 2000);
                }
            }
        } else if (isDeleting) {
            // Deleting: remove letters one by one
            if (displayedText.length > 0) {
                timeout = setTimeout(()=>{
                    setDisplayedText(displayedText.slice(0, -1));
                }, 50); // 50ms per letter
            } else {
                // Finished deleting, move to next text
                const nextIndex = currentTextIndex + 1;
                if (nextIndex < texts.length) {
                    setCurrentTextIndex(nextIndex);
                    setIsTyping(true);
                    setIsDeleting(false);
                }
            }
        }
        return ()=>clearTimeout(timeout);
    }, [
        displayedText,
        currentTextIndex,
        isTyping,
        isDeleting,
        texts
    ]);
    // Handle scroll to next section with slow animation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (shouldScroll) {
            const nextSection = document.getElementById('next-section');
            if (nextSection) {
                const targetPosition = nextSection.offsetTop;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 2000; // 2 seconds for slow scroll
                let start = null;
                const animateScroll = (currentTime)=>{
                    if (start === null) start = currentTime;
                    const timeElapsed = currentTime - start;
                    const progress = Math.min(timeElapsed / duration, 1);
                    // Easing function for smooth deceleration
                    const ease = 1 - Math.pow(1 - progress, 3);
                    window.scrollTo(0, startPosition + distance * ease);
                    if (timeElapsed < duration) {
                        requestAnimationFrame(animateScroll);
                    }
                };
                requestAnimationFrame(animateScroll);
            }
            setShouldScroll(false);
        }
    }, [
        shouldScroll
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-heading",
        children: displayedText
    }, void 0, false, {
        fileName: "[project]/app/components/intro-text.tsx",
        lineNumber: 123,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__843599cb._.js.map