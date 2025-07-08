// Shared utilities for Package Manager AI ecosystem
class PackageManagerUtils {
    constructor() {
        this.analytics = {
            events: [],
            performance: {}
        };
        this.init();
    }

    init() {
        this.setupErrorHandling();
        this.setupPerformanceMonitoring();
        this.setupNotificationSystem();
    }

    // Error handling system
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }

    logError(type, error) {
        const errorData = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        console.error('Package Manager AI Error:', errorData);
        this.analytics.events.push({
            type: 'error',
            data: errorData
        });
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            this.analytics.performance.navigationStart = performance.timing.navigationStart;
            this.analytics.performance.loadComplete = performance.timing.loadEventEnd;
        }
    }

    measurePerformance(label, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.analytics.events.push({
            type: 'performance',
            label,
            duration: end - start,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    // Input validation
    validateInput(input, type = 'text') {
        if (!input || typeof input !== 'string') {
            return { valid: false, error: 'Input must be a non-empty string' };
        }

        const sanitized = this.sanitizeInput(input);
        
        switch (type) {
            case 'packageName':
                return this.validatePackageName(sanitized);
            case 'projectName':
                return this.validateProjectName(sanitized);
            case 'json':
                return this.validateJSON(sanitized);
            default:
                return { valid: true, value: sanitized };
        }
    }

    sanitizeInput(input) {
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .trim();
    }

    validatePackageName(name) {
        const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
        if (!packageNameRegex.test(name)) {
            return { valid: false, error: 'Invalid package name format' };
        }
        return { valid: true, value: name };
    }

    validateProjectName(name) {
        const projectNameRegex = /^[a-zA-Z0-9-_]+$/;
        if (!projectNameRegex.test(name)) {
            return { valid: false, error: 'Project name can only contain letters, numbers, hyphens, and underscores' };
        }
        return { valid: true, value: name };
    }

    validateJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return { valid: true, value: parsed };
        } catch (error) {
            return { valid: false, error: 'Invalid JSON format' };
        }
    }

    // Notification system
    setupNotificationSystem() {
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
        `;
        notification.textContent = message;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        this.analytics.events.push({
            type: 'notification',
            message,
            notificationType: type,
            timestamp: new Date().toISOString()
        });
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Analytics tracking
    trackEvent(eventName, data = {}) {
        this.analytics.events.push({
            type: 'user_action',
            event: eventName,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }

    getAnalytics() {
        return {
            ...this.analytics,
            sessionDuration: Date.now() - (this.analytics.performance.navigationStart || Date.now()),
            pageViews: this.analytics.events.filter(e => e.type === 'page_view').length,
            errors: this.analytics.events.filter(e => e.type === 'error').length,
            userActions: this.analytics.events.filter(e => e.type === 'user_action').length
        };
    }

    // Utility functions
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Copied to clipboard!', 'success');
                this.trackEvent('copy_to_clipboard', { text: text.substring(0, 50) });
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('Copied to clipboard!', 'success');
                this.trackEvent('copy_to_clipboard', { text: text.substring(0, 50) });
            } catch (err) {
                this.showNotification('Failed to copy to clipboard', 'error');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Theme management
    initTheme() {
        const savedTheme = localStorage.getItem('package-manager-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        this.setTheme(theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('package-manager-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('package-manager-theme', theme);
        this.trackEvent('theme_change', { theme });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    [data-theme="dark"] {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #b3b3b3;
        --border-color: #404040;
        --accent-color: #3b82f6;
    }
    
    [data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --text-primary: #1a1a1a;
        --text-secondary: #6b7280;
        --border-color: #e5e7eb;
        --accent-color: #3b82f6;
    }
`;
document.head.appendChild(style);

// Initialize global utils instance
window.packageManagerUtils = new PackageManagerUtils();

// Auto-initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    window.packageManagerUtils.initTheme();
    window.packageManagerUtils.trackEvent('page_view', { 
        page: window.location.pathname,
        referrer: document.referrer 
    });
});