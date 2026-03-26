document.addEventListener('DOMContentLoaded', () => {

    /* ======================================================
       1. INTERSECTION OBSERVER — Fade Animations
    ====================================================== */
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.fade-up, .fade-in').forEach(el => fadeObserver.observe(el));

    /* ======================================================
       2. MENU CATEGORY reveal — staggered entrance
    ====================================================== */
    const menuRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const siblings = [...el.parentElement.querySelectorAll('.menu-category')];
                const delay = siblings.indexOf(el) * 100;
                setTimeout(() => el.classList.add('animate-in'), delay);
                menuRevealObserver.unobserve(el);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.menu-category').forEach(el => menuRevealObserver.observe(el));

    /* ======================================================
       3. MENU TAB SWITCHING
    ====================================================== */
    const menuTabs = document.querySelectorAll('.menu-tab');
    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            const content = document.getElementById('menu-' + target);
            content.classList.add('active');

            const cats = content.querySelectorAll('.menu-category');
            cats.forEach((cat, i) => {
                cat.classList.remove('animate-in');
                setTimeout(() => cat.classList.add('animate-in'), i * 100 + 50);
            });
        });
    });

    const activeTabContent = document.querySelector('.menu-tab-content.active');
    if (activeTabContent) {
        activeTabContent.querySelectorAll('.menu-category').forEach((cat, i) => {
            setTimeout(() => cat.classList.add('animate-in'), i * 100 + 400);
        });
    }

    /* ======================================================
       4. NAVBAR SCROLL EFFECT
    ====================================================== */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    /* ======================================================
       5. MOBILE MENU
    ====================================================== */
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileCloseBtn = document.getElementById('mobile-close-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');

    const toggleMenu = (open) => {
        mobileOverlay.classList.toggle('open', open);
        mobileBtn.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    };

    if (mobileBtn && mobileOverlay) {
        mobileBtn.addEventListener('click', () => {
            const willOpen = !mobileOverlay.classList.contains('open');
            toggleMenu(willOpen);
        });
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => toggleMenu(false));
    }

    if (mobileOverlay) {
        mobileOverlay.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });
    }

    /* ======================================================
       6. COUNTER ANIMATION (Stats Section)
    ====================================================== */
    const counters = document.querySelectorAll('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'), 10);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(el, target) {
        const duration = 1800;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - (1 - progress) * (1 - progress);
            const current = Math.round(eased * target);
            el.textContent = current.toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    }

    /* ======================================================
       7. HERO CANVAS SCROLL SEQUENCE
    ====================================================== */
    const canvas = document.getElementById("hero-canvas");

    // FIX 1: Don't return early — gate canvas logic so sections 8–10 always run.
    if (canvas) {
        const context = canvas.getContext("2d");

        const setCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
        };
        setCanvasSize();

        const TOTAL_FRAMES = 80;

        // FIX 2: Pre-allocate a fixed-size array so parallel loads land at the
        // correct index regardless of which image resolves first.
        const images = new Array(TOTAL_FRAMES).fill(null);
        let lastDrawnFrame = -1;

        const drawImageProp = (ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) => {
            if (!img || !img.naturalWidth) return;
            const iw = img.naturalWidth, ih = img.naturalHeight;
            const r = Math.max(w / iw, h / ih);
            const nw = iw * r, nh = ih * r;
            let cx = 0, cy = 0, cw = nw, ch = nh;

            if (nw >= w) { cx = (nw - w) * offsetX; cw = w; }
            if (nh >= h) { cy = (nh - h) * offsetY; ch = h; }

            ctx.drawImage(img, cx / r, cy / r, cw / r, ch / r, x, y, w, h);
        };

        const drawFrame = (index) => {
            const img = images[index];
            if (img && img.complete && img.naturalWidth) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
                lastDrawnFrame = index;
            }
        };

        // FIX 3: Find the nearest already-loaded frame so there's no blank canvas
        // while production images are still downloading.
        const drawNearestLoaded = (targetIdx) => {
            // Prefer an exact match, then search outward in both directions.
            for (let offset = 0; offset < TOTAL_FRAMES; offset++) {
                const lo = targetIdx - offset;
                const hi = targetIdx + offset;
                if (lo >= 0 && images[lo]?.complete && images[lo]?.naturalWidth) {
                    drawFrame(lo);
                    return;
                }
                if (hi < TOTAL_FRAMES && images[hi]?.complete && images[hi]?.naturalWidth) {
                    drawFrame(hi);
                    return;
                }
            }
        };

        // FIX 4: Load all images in parallel — each image starts downloading
        // immediately instead of waiting for the previous one to finish.
        // This is the main reason it glitched in production.
        const preloadImagesDynamically = () => {
            for (let i = 0; i < TOTAL_FRAMES; i++) {
                const img = new Image();
                const frameIndex = i; // capture for closure

                img.onload = () => {
                    images[frameIndex] = img;
                    // Draw the very first frame as soon as it's ready.
                    if (frameIndex === 0 && lastDrawnFrame === -1) {
                        drawFrame(0);
                    }
                };

                // On error just leave images[frameIndex] as null;
                // drawNearestLoaded will skip over gaps gracefully.
                img.onerror = () => { };

                img.src = `./images/img_${i + 1}.jpg`;
            }
        };

        let targetFrame = 0;
        let currentFrameIdx = 0;

        // Use a faster rate for mobile devices to prevent excessive swiping
        const SCROLL_PER_FRAME = window.innerWidth > 768 ? 60 : 25;
        const MAX_VIRTUAL_SCROLL = (TOTAL_FRAMES - 1) * SCROLL_PER_FRAME;

        let isLocked = true;
        let virtualScroll = 0;

        // FIX 5: Guard flag prevents lockHero → scroll event → lockHero loops.
        let suppressScrollLock = false;

        const lockHero = () => {
            isLocked = true;
            document.body.style.overflow = 'hidden';
        };

        const unlockHero = () => {
            isLocked = false;
            document.body.style.overflow = '';
        };

        const handleScrollEvent = (deltaY) => {
            if (!isLocked) return;

            virtualScroll += deltaY;
            virtualScroll = Math.max(0, Math.min(MAX_VIRTUAL_SCROLL, virtualScroll));
            targetFrame = virtualScroll / SCROLL_PER_FRAME;

            if (virtualScroll >= MAX_VIRTUAL_SCROLL && deltaY > 0) {
                unlockHero();
            } else if (virtualScroll <= 0 && deltaY < 0) {
                suppressScrollLock = true;
                window.scrollTo({ top: 0, behavior: 'instant' });
                suppressScrollLock = false;
            }
        };

        window.addEventListener('wheel', (e) => {
            if (isLocked) {
                e.preventDefault();
                handleScrollEvent(e.deltaY);
            }
        }, { passive: false });

        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isLocked) {
                e.preventDefault();
                const dy = touchStartY - e.touches[0].clientY;
                touchStartY = e.touches[0].clientY;
                handleScrollEvent(dy);
            }
        }, { passive: false });

        window.addEventListener('scroll', () => {
            // FIX 6: Skip re-lock entirely if we caused this scroll event ourselves.
            if (suppressScrollLock) return;

            if (window.scrollY <= 2 && !isLocked) {
                suppressScrollLock = true;
                window.scrollTo({ top: 0, behavior: 'instant' });
                suppressScrollLock = false;

                virtualScroll = MAX_VIRTUAL_SCROLL - 1;
                targetFrame = virtualScroll / SCROLL_PER_FRAME;
                lockHero();
            }
        });

        window.addEventListener('resize', () => {
            setCanvasSize();
            lastDrawnFrame = -1;
            const snapFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIdx)));
            drawNearestLoaded(snapFrame);
        });

        const updateFrameLoop = () => {
            // Smoothly interpolate current frame towards target frame for a buttery smooth scroll effect
            currentFrameIdx += (targetFrame - currentFrameIdx) * 0.15;
            const frameToDraw = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameIdx)));

            if (frameToDraw !== lastDrawnFrame) {
                // FIX 7: Use nearest-loaded fallback instead of hard-clamping
                // to images.length - 1, which caused frame jumps in production
                // while images were still downloading.
                if (images[frameToDraw]?.complete && images[frameToDraw]?.naturalWidth) {
                    drawFrame(frameToDraw);
                } else {
                    drawNearestLoaded(frameToDraw);
                }
            }

            requestAnimationFrame(updateFrameLoop);
        };

        if (window.scrollY > 0) {
            unlockHero();
            virtualScroll = MAX_VIRTUAL_SCROLL;
            targetFrame = TOTAL_FRAMES - 1;
            currentFrameIdx = TOTAL_FRAMES - 1;
        } else {
            lockHero();
        }

        preloadImagesDynamically();
        updateFrameLoop();
    }

    /* ======================================================
       8. ROAST ITEM STAGGER REVEAL
    ====================================================== */
    const roastItems = document.querySelectorAll('.roast-item');
    const roastObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const allItems = [...el.parentElement.querySelectorAll('.roast-item')];
                const delay = allItems.indexOf(el) * 120;
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateX(0)';
                }, delay);
                roastObserver.unobserve(el);
            }
        });
    }, { threshold: 0.15 });

    roastItems.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = i % 2 === 0 ? 'translateX(-20px)' : 'translateX(20px)';
        item.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
        roastObserver.observe(item);
    });

    /* ======================================================
       9. REVIEW CARDS STAGGER
    ====================================================== */
    const reviewCards = document.querySelectorAll('.review-card');
    const reviewObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const allCards = [...el.parentElement.querySelectorAll('.review-card')];
                const delay = allCards.indexOf(el) * 120;
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, delay);
                reviewObserver.unobserve(el);
            }
        });
    }, { threshold: 0.1 });

    reviewCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s';
        reviewObserver.observe(card);
    });

    /* ======================================================
       10. VISIT CARDS STAGGER
    ====================================================== */
    const visitCards = document.querySelectorAll('.visit-card');
    const visitObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const allCards = [...el.parentElement.querySelectorAll('.visit-card')];
                const delay = allCards.indexOf(el) * 120;
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, delay);
                visitObserver.unobserve(el);
            }
        });
    }, { threshold: 0.1 });

    visitCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1), background 0.3s';
        visitObserver.observe(card);
    });

});