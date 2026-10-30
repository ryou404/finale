/**
 * CareerDNA Exclusive GSAP Motion & UX Engine (careerdna-motion.js)
 * Built on official GreenSock (gsap-skills) & Impeccable craft principles:
 * - Compositor-first properties (x, y, scale, rotation, autoAlpha, strokeDashoffset)
 * - Responsive & Reduced-Motion accessibility via gsap.matchMedia()
 * - Zero-allocation pointer tracking via gsap.quickTo()
 * - Non-blocking Klein Brutalist Toast notifications & Scroll Progress indicator
 */
(function (root) {
    'use strict';

    const CareerDNAMotion = {
        mm: null,
        reducedMotion: false,
        initialized: false,

        init() {
            if (this.initialized) return;
            this.initialized = true;

            this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (typeof gsap === 'undefined') {
                // Graceful fallback: ensure all reveal elements are immediately visible
                document.querySelectorAll('.reveal-up').forEach((el) => {
                    el.classList.add('is-visible');
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
                return;
            }

            if (typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
            }

            gsap.defaults({
                ease: 'power3.out',
                duration: 0.6
            });

            this.mm = gsap.matchMedia();

            this.setupScrollProgressBar();
            this.setupScrollReveals();
            this.setupMagneticMicroInteractions();
            this.setupActiveNavIndicator();
        },

        /**
         * Top viewport scroll progress bar using compositor-only scaleX
         */
        setupScrollProgressBar() {
            if (document.getElementById('cdna-scroll-progress')) return;

            const bar = document.createElement('div');
            bar.id = 'cdna-scroll-progress';
            bar.setAttribute('aria-hidden', 'true');
            bar.style.cssText = [
                'position:fixed',
                'top:0',
                'left:0',
                'width:100%',
                'height:3px',
                'background:linear-gradient(90deg, #002FA7 0%, #1F50CD 55%, #3B6BF0 100%)',
                'transform-origin:0% 50%',
                'transform:scaleX(0)',
                'z-index:9999',
                'pointer-events:none',
                'will-change:transform'
            ].join(';');
            document.body.appendChild(bar);

            if (typeof ScrollTrigger !== 'undefined' && !this.reducedMotion) {
                gsap.to(bar, {
                    scaleX: 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: document.documentElement,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 0.15
                    }
                });
            } else {
                const updateBar = () => {
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
                    bar.style.transform = `scaleX(${progress})`;
                };
                window.addEventListener('scroll', updateBar, { passive: true });
                updateBar();
            }
        },

        /**
         * Coordinated ScrollTrigger.batch for .reveal-up elements
         */
        setupScrollReveals() {
            const revealEls = gsap.utils.toArray('.reveal-up');
            if (!revealEls.length) return;

            if (this.reducedMotion || typeof ScrollTrigger === 'undefined') {
                revealEls.forEach((el) => {
                    el.classList.add('is-visible');
                    gsap.set(el, { autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
                });
                return;
            }

            // Immediately reveal elements already in the initial viewport or managed by custom hero timeline
            revealEls.forEach((el) => {
                if (el.hasAttribute('data-gsap-custom')) {
                    el.classList.add('is-visible');
                    return;
                }
                gsap.set(el, { autoAlpha: 0, y: 24 });
            });

            const batchTargets = revealEls.filter((el) => !el.hasAttribute('data-gsap-custom'));
            if (!batchTargets.length) return;

            ScrollTrigger.batch(batchTargets, {
                interval: 0.08,
                batchMax: 6,
                start: 'top 90%',
                onEnter: (batch) => {
                    batch.forEach((el) => el.classList.add('is-visible'));
                    gsap.to(batch, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.65,
                        stagger: 0.08,
                        ease: 'power3.out',
                        overwrite: true,
                        clearProps: 'transform'
                    });
                },
                once: true
            });
        },

        /**
         * Subtle 60fps magnetic button & card micro-interactions using gsap.quickTo
         */
        setupMagneticMicroInteractions() {
            if (!this.mm) return;

            this.mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
                const magneticBtns = gsap.utils.toArray('[data-magnetic], .hover-spring');
                const cleanups = [];

                magneticBtns.forEach((btn) => {
                    // Only apply subtle magnetic pull to compact CTA buttons/links, not giant containers
                    if (btn.offsetWidth > 420 || btn.offsetHeight > 140) return;

                    const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
                    const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });

                    const onMove = (e) => {
                        const rect = btn.getBoundingClientRect();
                        const relX = e.clientX - (rect.left + rect.width / 2);
                        const relY = e.clientY - (rect.top + rect.height / 2);
                        xTo(gsap.utils.clamp(-6, 6, relX * 0.14));
                        yTo(gsap.utils.clamp(-4, 4, relY * 0.14));
                    };

                    const onLeave = () => {
                        xTo(0);
                        yTo(0);
                    };

                    btn.addEventListener('mousemove', onMove);
                    btn.addEventListener('mouseleave', onLeave);
                    cleanups.push(() => {
                        btn.removeEventListener('mousemove', onMove);
                        btn.removeEventListener('mouseleave', onLeave);
                    });
                });

                return () => cleanups.forEach((fn) => fn());
            });
        },

        /**
         * Subtle entrance on active nav link underline
         */
        setupActiveNavIndicator() {
            if (this.reducedMotion || typeof gsap === 'undefined') return;
            const logoBolt = document.querySelector('nav .fa-bolt, header .fa-bolt');
            if (logoBolt && logoBolt.parentElement) {
                const iconBox = logoBolt.parentElement;
                iconBox.addEventListener('mouseenter', () => {
                    gsap.fromTo(logoBolt,
                        { rotation: -15, scale: 0.85 },
                        { rotation: 0, scale: 1.12, duration: 0.35, ease: 'back.out(2.2)', overwrite: true }
                    );
                });
                iconBox.addEventListener('mouseleave', () => {
                    gsap.to(logoBolt, { rotation: 0, scale: 1, duration: 0.25, ease: 'power2.out', overwrite: true });
                });
            }
        },

        /**
         * Animate a numeric counter smoothly with tabular numerals
         */
        animateCounter(elOrSelector, targetValue, options = {}) {
            const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
            if (!el) return null;

            const suffix = options.suffix !== undefined ? options.suffix : '';
            const prefix = options.prefix !== undefined ? options.prefix : '';
            const duration = this.reducedMotion ? 0 : (options.duration || 0.85);
            const startValue = options.startValue !== undefined ? options.startValue : (parseFloat(el.textContent) || 0);
            const decimals = options.decimals || 0;

            el.style.fontVariantNumeric = 'tabular-nums';

            if (typeof gsap === 'undefined' || duration === 0) {
                el.textContent = `${prefix}${Number(targetValue).toFixed(decimals)}${suffix}`;
                return null;
            }

            const proxy = { val: startValue };
            return gsap.to(proxy, {
                val: Number(targetValue),
                duration,
                ease: options.ease || 'power2.out',
                onUpdate: () => {
                    el.textContent = `${prefix}${proxy.val.toFixed(decimals)}${suffix}`;
                }
            });
        },

        /**
         * Tactile pulse animation on a badge, counter, or chip when state changes
         */
        pulseElement(elOrSelector, scalePeak = 1.14) {
            const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
            if (!el || typeof gsap === 'undefined' || this.reducedMotion) return;

            gsap.fromTo(
                el,
                { scale: scalePeak },
                { scale: 1, duration: 0.35, ease: 'back.out(2.4)', overwrite: 'auto' }
            );
        },

        /**
         * Non-blocking Klein Brutalist Toast Notification with GSAP entrance/exit
         */
        showToast(message, type = 'info', durationMs = 3200) {
            let container = document.getElementById('cdna-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'cdna-toast-container';
                container.className = 'fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9998] flex flex-col gap-2.5 pointer-events-none max-w-[92vw] sm:max-w-sm';
                document.body.appendChild(container);
            }

            const palette = {
                success: { bg: '#002FA7', border: '#1F50CD', icon: 'fa-circle-check', badge: 'SYNC OK' },
                warning: { bg: '#1E3A8A', border: '#3B6BF0', icon: 'fa-bolt', badge: 'NOTICE' },
                error:   { bg: '#991B1B', border: '#EF4444', icon: 'fa-triangle-exclamation', badge: 'ALERT' },
                info:    { bg: '#002FA7', border: '#C7DCFF', icon: 'fa-dna', badge: 'SYSTEM' }
            }[type] || { bg: '#002FA7', border: '#C7DCFF', icon: 'fa-dna', badge: 'SYSTEM' };

            const toast = document.createElement('div');
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.style.cssText = `background-color:${palette.bg};border:1px solid ${palette.border};box-shadow:0 16px 32px -12px rgba(0,47,167,0.38);`;
            toast.className = 'px-4 py-3 text-white font-body text-xs sm:text-sm flex items-center gap-3 pointer-events-auto';

            const iconEl = document.createElement('i');
            iconEl.className = `fa-solid ${palette.icon} text-[#EBF2FF] text-sm shrink-0`;

            const textWrap = document.createElement('div');
            textWrap.className = 'flex flex-col gap-0.5 min-w-0';

            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'font-mono text-[10px] font-bold tracking-[0.16em] uppercase text-[#C7DCFF]';
            badgeSpan.textContent = palette.badge;

            const msgSpan = document.createElement('span');
            msgSpan.className = 'font-medium text-white leading-snug break-words';
            msgSpan.textContent = message;

            textWrap.appendChild(badgeSpan);
            textWrap.appendChild(msgSpan);
            toast.appendChild(iconEl);
            toast.appendChild(textWrap);
            container.appendChild(toast);

            if (typeof gsap !== 'undefined' && !this.reducedMotion) {
                gsap.fromTo(
                    toast,
                    { autoAlpha: 0, y: 18, scale: 0.96 },
                    { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: 'power3.out' }
                );
                gsap.to(toast, {
                    autoAlpha: 0,
                    y: 10,
                    duration: 0.25,
                    delay: durationMs / 1000,
                    ease: 'power2.in',
                    onComplete: () => toast.remove()
                });
            } else {
                setTimeout(() => toast.remove(), durationMs);
            }
        }
    };

    root.CareerDNAMotion = CareerDNAMotion;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CareerDNAMotion.init());
    } else {
        CareerDNAMotion.init();
    }
})(typeof window !== 'undefined' ? window : this);
