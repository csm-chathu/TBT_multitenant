import React, { useEffect, useState } from 'react';
import Button from '@/components/Atomic/Button';

const ThemeSwitch: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        // Initial theme: from localStorage or system preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
            if (saved) return saved;
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : 'light';
        }
        return 'light';
    });

    // Apply theme class and save to localStorage
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-color-mode', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-color-mode', 'light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Optional: listen to system theme changes if no theme is saved
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return; // don't override user choice

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const systemChangeHandler = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };
        media.addEventListener('change', systemChangeHandler);
        return () => media.removeEventListener('change', systemChangeHandler);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <Button
            icon={theme === 'dark' ? 'light_mode' : 'dark_mode'}
            style="Icon"
            onClick={toggleTheme}
        />
    );
};

export default ThemeSwitch;