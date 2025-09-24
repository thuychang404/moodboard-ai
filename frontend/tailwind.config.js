/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                // Custom mood colors
                mood: {
                    blue: "#3B82F6",
                    purple: "#8B5CF6",
                    pink: "#EC4899",
                    green: "#10B981",
                    orange: "#F59E0B",
                    red: "#EF4444",
                    indigo: "#6366F1",
                },
                // Gradient colors
                gradient: {
                    start: "#667eea",
                    end: "#764ba2",
                },
            },
            animation: {
                "pulse-slow": "pulse 3s infinite",
                "bounce-slow": "bounce 2s infinite",
                "fade-in": "fadeIn 0.5s ease-in",
                "slide-up": "slideUp 0.6s ease-out",
                float: "float 6s ease-in-out infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
            boxShadow: {
                glow: "0 0 20px rgba(139, 92, 246, 0.3)",
                "glow-pink": "0 0 20px rgba(236, 72, 153, 0.3)",
                "inner-lg": "inset 0 2px 8px 0 rgba(0, 0, 0, 0.06)",
            },
        },
    },
    plugins: [],
};
