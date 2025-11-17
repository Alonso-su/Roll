/**
 * Advanced Theme Toggle - Ported from Litos-main
 * Supports light, dark, and system themes with smooth animations
 */
(function() {
    'use strict';

    class ThemeToggle {
        constructor() {
            this.themes = ['light', 'dark', 'system'];
            this.currentTheme = 'system';
            this.button = null;
            this.icons = {};
            
            this.init();
        }

        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                // If DOM is already ready, setup immediately
                setTimeout(() => this.setup(), 0);
            }
        }

        setup() {
            this.button = document.getElementById('theme-toggle');
            if (!this.button) return;

            // Get icon elements
            this.icons = {
                sun: this.button.querySelector('.theme-icon-sun'),
                moon: this.button.querySelector('.theme-icon-moon'),
                system: this.button.querySelector('.theme-icon-system')
            };

            // Load saved theme or default to system
            this.currentTheme = localStorage.getItem('theme') || 'system';
            
            // DON'T re-apply theme on page load - it's already set by inline script
            // Just update the icons to match current state
            this.updateIcons();

            // Add click handler
            this.button.addEventListener('click', () => this.handleClick());

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (this.currentTheme === 'system') {
                        this.applyTheme('system', false);
                    }
                });
            }
        }

        handleClick() {
            // Cycle through themes: light -> dark -> system -> light
            const themeMap = {
                light: 'dark',
                dark: 'system',
                system: 'light'
            };
            
            this.currentTheme = themeMap[this.currentTheme];
            this.applyTheme(this.currentTheme, true); // Enable transition for user clicks
            this.updateIcons();
            
            // Save to localStorage
            localStorage.setItem('theme', this.currentTheme);
        }

        applyTheme(theme, skipTransition = false) {
            const root = document.documentElement;
            
            let isDark = false;
            
            if (theme === 'dark') {
                isDark = true;
            } else if (theme === 'system') {
                isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            
            // Only add transition disable class if explicitly requested (for user clicks)
            if (skipTransition) {
                root.classList.add('disable-transition');
            }
            
            // Apply theme class
            root.classList.toggle('dark', isDark);
            
            // Remove transition disable class after a short delay
            if (skipTransition) {
                setTimeout(() => {
                    root.classList.remove('disable-transition');
                }, 100);
            }
        }

        updateIcons() {
            // Remove active class from all icons
            Object.values(this.icons).forEach(icon => {
                if (icon) icon.classList.remove('active');
            });
            
            // Determine which icon should be active
            let activeIconKey;
            if (this.currentTheme === 'light') {
                activeIconKey = 'sun';
            } else if (this.currentTheme === 'dark') {
                activeIconKey = 'moon';
            } else {
                activeIconKey = 'system';
            }
            
            // Add active class to current theme icon
            const activeIcon = this.icons[activeIconKey];
            if (activeIcon) {
                activeIcon.classList.add('active');
            }
        }
    }

    // Initialize theme toggle
    new ThemeToggle();
})();