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
                // Use index from nodeList for stagger delay
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

            // Re-trigger menu category animations for newly visible tab
            const cats = content.querySelectorAll('.menu-category');
            cats.forEach((cat, i) => {
                cat.classList.remove('animate-in');
                setTimeout(() => cat.classList.add('animate-in'), i * 100 + 50);
            });
        });
    });

    // Trigger initial visible tab categories on load
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

    // Close on link click
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
            // Ease out quad
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
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const heroScrollContainer = document.querySelector(".hero-scroll-container");

    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        // Keep CSS size in sync so the canvas doesn't stretch
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    };
    setCanvasSize();

    let loadedFrameCount = 0;
    const images = [];

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

    const preloadImagesDynamically = () => {
        let currentIndex = 1;

        const loadNextImage = () => {
            const img = new Image();

            img.onload = () => {
                images.push(img);
                loadedFrameCount++;

                if (currentIndex === 1) {
                    drawFrame(0);
                }

                currentIndex++;
                loadNextImage();
            };

            img.onerror = () => {
                // End of frames — stop loading
            };

            img.src = `./images/img_${currentIndex}.jpg`;
        };

        loadNextImage();
    };

    let targetFrame = 0;
    let currentFrameIdx = 0;
    let lastDrawnFrame = -1;

    const getScrollRange = () => {
        // Use scrollHeight to get the true pinned-section scroll distance
        return Math.max(1, (heroScrollContainer.scrollHeight || heroScrollContainer.clientHeight) - window.innerHeight);
    };

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const containerBottom = heroScrollContainer.offsetTop + (heroScrollContainer.scrollHeight || heroScrollContainer.clientHeight);
        if (scrollTop <= containerBottom) {
            const maxScroll = getScrollRange();
            const scrollFraction = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
            if (loadedFrameCount > 0) {
                targetFrame = scrollFraction * (loadedFrameCount - 1);
            }
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        setCanvasSize();
        lastDrawnFrame = -1;
        // Immediately redraw current frame at new size
        const snapFrame = Math.min(loadedFrameCount - 1, Math.max(0, Math.round(currentFrameIdx)));
        if (snapFrame >= 0) drawFrame(snapFrame);
    });

    const updateFrameLoop = () => {
        if (loadedFrameCount > 0) {
            const diff = targetFrame - currentFrameIdx;
            // Snap directly when very close to avoid infinite drift
            if (Math.abs(diff) < 0.5) {
                currentFrameIdx = targetFrame;
            } else {
                currentFrameIdx += diff * 0.1;
            }

            const frameToDraw = Math.min(loadedFrameCount - 1, Math.max(0, Math.round(currentFrameIdx)));

            if (frameToDraw !== lastDrawnFrame) {
                drawFrame(frameToDraw);
            }
        }
        requestAnimationFrame(updateFrameLoop);
    };

    preloadImagesDynamically();
    updateFrameLoop();

    /* ======================================================
       8. ROAST ITEM STAGGER REVEAL
    ====================================================== */
    const roastItems = document.querySelectorAll('.roast-item');
    const roastObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
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
