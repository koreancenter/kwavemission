(function () {
    'use strict';

    class ApiClient {
        constructor(baseUrl = '') {
            this.baseUrl = baseUrl;
            this.refreshPromise = null;
        }

        buildUrl(path = '') {
            if (!path) return this.baseUrl;
            if (/^https?:\/\//i.test(path)) return path;
            return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        }

        getStorage() {
            return window.sessionStorage || null;
        }

        getAccessToken() {
            return this.getStorage()?.getItem('adminAccessToken') || '';
        }

        setAccessToken(token) {
            if (!token) {
                this.clearTokens();
                return;
            }
            this.getStorage()?.setItem('adminAccessToken', token);
        }

        getRefreshToken() {
            return this.getStorage()?.getItem('adminRefreshToken') || '';
        }

        setRefreshToken(token) {
            if (!token) {
                this.getStorage()?.removeItem('adminRefreshToken');
                return;
            }
            this.getStorage()?.setItem('adminRefreshToken', token);
        }

        clearTokens() {
            this.getStorage()?.removeItem('adminAccessToken');
            this.getStorage()?.removeItem('adminRefreshToken');
            document.cookie = 'admin_session=; Path=/; SameSite=Lax; Max-Age=0';
        }

        attachAuthHeader(headers = {}, skipAuth = false) {
            const requestHeaders = { ...headers };
            if (!skipAuth) {
                const token = this.getAccessToken();
                if (token) {
                    requestHeaders.Authorization = `Bearer ${token}`;
                }
            }
            return requestHeaders;
        }

        static parsePayload(rawText) {
            if (!rawText) return {};
            try {
                return JSON.parse(rawText);
            } catch {
                return { message: rawText };
            }
        }

        static normalizeError(response, payload, fallbackMessage = 'Request failed') {
            const message =
                payload?.message ||
                payload?.error ||
                payload?.detail ||
                payload?.errors?.[0] ||
                payload?.errors?.message ||
                (response && response.statusText ? response.statusText : '') ||
                fallbackMessage;

            const error = new Error(message);
            error.status = response && response.status ? response.status : 500;
            error.payload = payload || {};
            error.response = response || null;
            return error;
        }

        async refreshSession() {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                window.dispatchEvent(new CustomEvent('admin:require-login', { detail: { reason: 'Session expired' } }));
                return false;
            }

            if (this.refreshPromise) {
                return this.refreshPromise;
            }

            this.refreshPromise = (async () => {
                try {
                    const response = await fetch(this.buildUrl('/api/refresh'), {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ refreshToken })
                    });

                    const rawText = await response.text();
                    const payload = ApiClient.parsePayload(rawText);
                    const accessToken = payload?.data?.accessToken || payload?.accessToken;
                    const nextRefreshToken = payload?.data?.refreshToken || payload?.refreshToken;

                    if (!response.ok || payload?.success === false || !accessToken) {
                        throw ApiClient.normalizeError(response, payload, '세션이 만료되었습니다. 다시 로그인해주세요.');
                    }

                    this.setAccessToken(accessToken);
                    if (nextRefreshToken) {
                        this.setRefreshToken(nextRefreshToken);
                    }
                    return true;
                } catch (error) {
                    this.clearTokens();
                    window.dispatchEvent(new CustomEvent('admin:require-login', { detail: { reason: error.message } }));
                    return false;
                } finally {
                    this.refreshPromise = null;
                }
            })();

            return this.refreshPromise;
        }

        async request({
            method = 'GET',
            path = '',
            body = null,
            headers = {},
            isFormData = false,
            credentials = 'same-origin',
            skipAuth = false,
            retry = false
        } = {}) {
            const url = this.buildUrl(path);
            const requestHeaders = this.attachAuthHeader(headers, skipAuth);

            if (!isFormData && !(body instanceof FormData) && body !== undefined && body !== null && !requestHeaders['Content-Type']) {
                requestHeaders['Content-Type'] = 'application/json';
            }

            const response = await fetch(url, {
                method,
                credentials,
                headers: requestHeaders,
                body: body == null
                    ? undefined
                    : isFormData || body instanceof FormData
                        ? body
                        : JSON.stringify(body)
            });

            const rawText = await response.text();
            const payload = ApiClient.parsePayload(rawText);
            const isFailure =
                !response.ok ||
                payload?.success === false ||
                payload?.status === 'error' ||
                payload?.error !== undefined ||
                payload?.message === 'error' ||
                payload?.message === 'Error';

            if (response.status === 401 && !retry) {
                const refreshed = await this.refreshSession();
                if (refreshed) {
                    return this.request({
                        method,
                        path,
                        body,
                        headers,
                        isFormData,
                        credentials,
                        skipAuth,
                        retry: true
                    });
                }
            }

            if (isFailure) {
                throw ApiClient.normalizeError(response, payload, '요청 처리 중 문제가 발생했습니다.');
            }

            return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
        }

        get(path, options = {}) {
            return this.request({ method: 'GET', path, ...options });
        }

        post(path, body, options = {}) {
            return this.request({ method: 'POST', path, body, ...options });
        }

        put(path, body, options = {}) {
            return this.request({ method: 'PUT', path, body, ...options });
        }

        delete(path, options = {}) {
            return this.request({ method: 'DELETE', path, ...options });
        }

        upload(path, formData) {
            return this.request({
                method: 'POST',
                path,
                body: formData,
                isFormData: true
            });
        }
    }

    class ToastManager {
        constructor() {
            this.container = this.createContainer();
        }

        createContainer() {
            let container = document.getElementById('app-toast-container');
            if (container) return container;

            container = document.createElement('div');
            container.id = 'app-toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '99999',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none'
            });

            document.body.appendChild(container);
            return container;
        }

        show(message, type = 'error', duration = 4000) {
            const safeMessage = typeof message === 'string' && message.trim() ? message.trim() : '요청 처리 중 문제가 발생했습니다.';
            const toast = document.createElement('div');
            const palette = {
                success: { background: '#0f766e', color: '#ecfeff', border: '#115e59' },
                error: { background: '#7f1d1d', color: '#fee2e2', border: '#991b1b' },
                warning: { background: '#78350f', color: '#fef3c7', border: '#92400e' },
                info: { background: '#1d4ed8', color: '#dbeafe', border: '#1e40af' }
            };
            const tone = palette[type] || palette.info;

            toast.className = 'app-toast';
            toast.textContent = safeMessage;
            Object.assign(toast.style, {
                minWidth: '260px',
                maxWidth: '360px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
                background: tone.background,
                color: tone.color,
                border: `1px solid ${tone.border}`,
                opacity: '0',
                transform: 'translateY(-8px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                pointerEvents: 'auto'
            });

            this.container.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-8px)';
                setTimeout(() => toast.remove(), 220);
            }, duration);
        }
    }

    const baseUrl = (window.location.protocol === 'file:' || window.location.origin === 'null') ? 'http://localhost:8788' : '';

    window.KWaveApi = {
        ApiClient,
        ToastManager,
        api: new ApiClient(baseUrl),
        toast: new ToastManager(),

        async fetchPosts(type) {
            const q = type ? ('?type=' + encodeURIComponent(type)) : '?type=all';
            return this.api.get('/api/get-posts' + q);
        },

        async fetchPostById(id) {
            return this.api.get('/api/get-posts?id=' + encodeURIComponent(id));
        },

        async fetchMarkdownBySlug(slug) {
            const result = await this.api.get('/api/get-md?slug=' + encodeURIComponent(slug));
            return result;
        }
    };
})();
