// --- UTILITY: THROTTLE FUNCTION for performance ---
// Limits how often a function can run in a given time period (ms).
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// --- FEATURE 0: LUCIDE ICONS ---
lucide.createIcons({
    attrs: {
        strokeWidth: 1.5,
    }
});

// --- FEATURE 1: LIQUID SMOOTH SCROLLING (LENIS) ---
if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
} else {
    console.warn("Lenis scroll script failed to load. Fallback to native scroll.");
}


// --- FEATURE 2: SCRAMBLE TEXT EFFECT ---
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

function scrambleText(element) {
    let iteration = 0;
    const originalText = element.dataset.value;
    let interval = null;

    clearInterval(interval);

    interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((letter, index) => {
                if(index < iteration) {
                    return originalText[index];
                }
                return letters[Math.floor(Math.random() * 26)];
            })
            .join("");

        if(iteration >= originalText.length) { 
            clearInterval(interval);
        }
        
        // Increased speed for snappier text reveal
        iteration += 0.4; 
    }, 25); // Slightly faster interval
}

// --- FEATURE 3: SPOTLIGHT MOUSE TRACKING (THROTTLED) ---
const handleMouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty('--cursor-x', x + 'px');
    document.documentElement.style.setProperty('--cursor-y', y + 'px');
};

// Throttle global mouse move to run at most ~30 times per second for jitter reduction
document.documentElement.addEventListener('mousemove', throttle(handleMouseMove, 33));

// Keep spotlight card logic unthrottled for local precision on hover
document.querySelectorAll('.spotlight-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--cursor-x', x + 'px');
        card.style.setProperty('--cursor-y', y + 'px');
    });
});

// --- FEATURE 4: ANIMATED COUNTER (IntersectionObserver) ---
function animateCounter(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const finalValue = parseInt(target.dataset.target, 10);
            const duration = 2000; // 2 seconds
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = Math.floor(progress * finalValue);
                target.innerText = currentValue.toLocaleString('en-US') + '+';

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    target.innerText = finalValue.toLocaleString('en-US') + '+';
                    observer.unobserve(target); // Stop observing after animation is complete
                }
            };

            requestAnimationFrame(updateCount);
        }
    });
}

// Create an observer for all counter elements
const counterObserver = new IntersectionObserver(animateCounter, {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.5 // trigger when 50% visible
});


// --- FEATURE 5: GSAP ANIMATION SEQUENCE & FALLBACK (Optimized for speed) ---
document.addEventListener("DOMContentLoaded", () => {
    // Start observing the counter element
    const counterElement = document.querySelector('.counter');
    if (counterElement) {
        counterObserver.observe(counterElement);
    }
    
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Use a faster, lighter ease for a snappier feel
        const FAST_EASE = "back.out(1.2)";
        
        const tl = gsap.timeline({ defaults: { ease: FAST_EASE } });

        tl.fromTo("#navbar", 
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" } // Fast and simple
        )
        .fromTo(".hero-main",
            { scale: 0.95, opacity: 0, y: 40 }, // Increased y for snappier effect
            { 
                scale: 1, 
                opacity: 1, 
                y: 0, 
                duration: 0.9, // Main element prominence
                ease: FAST_EASE,
                onStart: () => {
                    const hackerText = document.querySelector('.hacker-text');
                    if(hackerText) scrambleText(hackerText);
                }
            },
            "-=0.5" // Start overlap faster
        )
        .fromTo(".hero-child",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.08, duration: 0.6 }, // Faster stagger and duration
            "<0.1" // Start right after the main element starts moving
        )
        .fromTo(".hero-stat",
            { x: 20, opacity: 0 },
            { x: 0, opacity: 1, stagger: 0.1, duration: 0.7 }, // Faster duration
            "-=0.6"
        )
        .fromTo(".hero-ticker",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 }, // Faster duration
            "-=0.5"
        );

        // Scroll reveal optimization: Removed performance-heavy blur filter
        const scrollItems = document.querySelectorAll(".scroll-reveal");
        scrollItems.forEach((item) => {
            gsap.fromTo(item, 
                { y: 40, opacity: 0 }, // Removed filter: "blur(10px)" for performance
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, // Faster duration
                    ease: "power2.out", 
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%", 
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    } else {
        // ESSENTIAL FALLBACK FIX: If GSAP fails to load, make everything visible.
        document.querySelectorAll('.opacity-0').forEach(el => el.style.opacity = 1);
        console.error("GSAP/ScrollTrigger failed to load. Animation fallback active.");
    }
});

// --- FEATURE 6: LAZY LOAD SPLINE ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const container = document.getElementById('spline-wrapper');
        if(container) {
            container.innerHTML = `<iframe src='https://my.spline.design/void-d1YtgG7anoiAfUCxTSLbKJQv/' frameborder='0' width='100%' height='100%'></iframe>`;
            container.style.opacity = '0.3';
        }
    }, 500);
});