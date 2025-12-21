"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typewriterSound } from "@/app/utils/typewriter-sound";

interface IntroTextProps {
  texts: string[];
}

export default function IntroText({ texts }: IntroTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const previousTextRef = useRef("");

  // Calculate typing speed with easing curve - slower at start, faster as it goes
  const getTypingDelay = (charIndex: number, textLength: number): number => {
    const currentText = texts[currentTextIndex];
    if (!currentText) return 50;
    
    // Find first word boundary (first space)
    const spaceIndex = currentText.indexOf(' ');
    const firstSpaceIndex = spaceIndex !== -1 ? spaceIndex : textLength;
    
    // If we're in the first word, use slower speed with easing
    if (charIndex < firstSpaceIndex) {
      // Easing curve: start at 200ms, gradually decrease to 50ms
      const progress = charIndex / firstSpaceIndex;
      const easedProgress = progress * progress; // Quadratic easing
      return 200 - (easedProgress * 150); // 200ms to 50ms
    }
    
    // After first word, use normal speed
    return 50;
  };

  // Handle click to start
  const handleClickToStart = useCallback(() => {
    setHasClicked(true);
  }, []);

  // Listen for clicks anywhere on the page
  useEffect(() => {
    if (hasClicked) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      handleClickToStart();
    };

    // Listen for both mouse clicks and touch events
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick, { passive: true });

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, [hasClicked, handleClickToStart]);

  // Play sound effects when text changes
  useEffect(() => {
    if (!hasStarted) return;

    const previousText = previousTextRef.current;
    
    if (displayedText.length > previousText.length) {
      // Character was added - play typing sound
      const newChar = displayedText[displayedText.length - 1];
      if (newChar) {
        typewriterSound.playSound(newChar);
      }
    } else if (displayedText.length < previousText.length) {
      // Character was removed - play delete sound
      typewriterSound.playDeleteSound();
    }

    previousTextRef.current = displayedText;
  }, [displayedText, hasStarted]);

  // Start animation after click
  useEffect(() => {
    if (!hasClicked) return;

    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
    }, 1500);

    return () => clearTimeout(delayTimeout);
  }, [hasClicked]);

  useEffect(() => {
    if (!hasStarted || texts.length === 0) return;

    const currentText = texts[currentTextIndex];
    if (!currentText) return;

    let timeout: NodeJS.Timeout;

    const isLastText = currentTextIndex === texts.length - 1;

    if (isTyping && !isDeleting) {
      // Typing in: add letters one by one
      if (displayedText.length < currentText.length) {
        const delay = getTypingDelay(displayedText.length, currentText.length);
        timeout = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, delay);
      } else {
        // Finished typing
        if (isLastText) {
          // Stay at the last text, don't delete
          // Trigger scroll after 3 seconds
          timeout = setTimeout(() => {
            setShouldScroll(true);
          }, 3000);
          return;
        } else {
          // Wait 1 second then start deleting
          timeout = setTimeout(() => {
            setIsTyping(false);
            setIsDeleting(true);
          }, 1000);
        }
      }
    } else if (isDeleting) {
      // Deleting: remove letters one by one
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
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

    return () => clearTimeout(timeout);
  }, [displayedText, currentTextIndex, isTyping, isDeleting, texts, hasStarted]);

  // Handle scroll to next section with slow animation
  useEffect(() => {
    if (shouldScroll) {
      // Play scroll sound when animation starts
      typewriterSound.playScrollSound();

      const nextSection = document.getElementById('next-section');
      if (nextSection) {
        const targetPosition = nextSection.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 2000; // 2 seconds for slow scroll
        let start: number | null = null;

        const animateScroll = (currentTime: number) => {
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
  }, [shouldScroll]);

  return (
    <div className="relative text-center">
      <div className="text-heading">
        {!hasClicked ? (
          <span className="font-dashing text-foreground opacity-20">click to start</span>
        ) : (
          displayedText
        )}
      </div>
    </div>
  );
}

