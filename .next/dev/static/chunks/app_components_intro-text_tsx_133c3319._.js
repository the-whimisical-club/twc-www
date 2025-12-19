(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/components/intro-text.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IntroText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function IntroText({ texts }) {
    _s();
    const [currentTextIndex, setCurrentTextIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [displayedText, setDisplayedText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isTyping, setIsTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isDeleting, setIsDeleting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "IntroText.useEffect": ()=>{
            if (texts.length === 0) return;
            const currentText = texts[currentTextIndex];
            if (!currentText) return;
            let timeout;
            const isLastText = currentTextIndex === texts.length - 1;
            if (isTyping && !isDeleting) {
                // Typing in: add letters one by one
                if (displayedText.length < currentText.length) {
                    const delay = getTypingDelay(displayedText.length, currentText.length);
                    timeout = setTimeout({
                        "IntroText.useEffect": ()=>{
                            setDisplayedText(currentText.slice(0, displayedText.length + 1));
                        }
                    }["IntroText.useEffect"], delay);
                } else {
                    // Finished typing
                    if (isLastText) {
                        // Stay at the last text, don't delete
                        return;
                    } else {
                        // Wait 3 seconds then start deleting
                        timeout = setTimeout({
                            "IntroText.useEffect": ()=>{
                                setIsTyping(false);
                                setIsDeleting(true);
                            }
                        }["IntroText.useEffect"], 3000);
                    }
                }
            } else if (isDeleting) {
                // Deleting: remove letters one by one
                if (displayedText.length > 0) {
                    timeout = setTimeout({
                        "IntroText.useEffect": ()=>{
                            setDisplayedText(displayedText.slice(0, -1));
                        }
                    }["IntroText.useEffect"], 50); // 50ms per letter
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
            return ({
                "IntroText.useEffect": ()=>clearTimeout(timeout)
            })["IntroText.useEffect"];
        }
    }["IntroText.useEffect"], [
        displayedText,
        currentTextIndex,
        isTyping,
        isDeleting,
        texts
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        className: "text-heading",
        initial: {
            opacity: 0
        },
        animate: {
            opacity: 1
        },
        transition: {
            duration: 0.3
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            mode: "wait",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                exit: {
                    opacity: 0
                },
                transition: {
                    duration: 0.15,
                    ease: "easeInOut"
                },
                children: displayedText
            }, `${currentTextIndex}-${displayedText.length}`, false, {
                fileName: "[project]/app/components/intro-text.tsx",
                lineNumber: 94,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/components/intro-text.tsx",
            lineNumber: 93,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/components/intro-text.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s(IntroText, "LKRa57eeinCsSM2WLrF5WUX7mSI=");
_c = IntroText;
var _c;
__turbopack_context__.k.register(_c, "IntroText");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_components_intro-text_tsx_133c3319._.js.map