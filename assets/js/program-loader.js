(function () {
    'use strict';

    const STATUS_META = {
        recruiting: { label: '모집 중', accent: 'rose', iconTone: 'text-slate-200' },
        ongoing: { label: '진행 중', accent: 'cyan', iconTone: 'text-slate-200' },
        preparing: { label: '준비 중', accent: 'slate', iconTone: 'text-slate-400' }
    };

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeStatus(value) {
        return Object.prototype.hasOwnProperty.call(STATUS_META, value) ? value : 'preparing';
    }

    function normalizeSlug(value) {
        const slug = String(value || '').trim();
        return /^[a-zA-Z0-9_-]+$/.test(slug) ? slug : '';
    }

    function unwrapItems(payload) {
        if (Array.isArray(payload)) return payload;
        return payload && Array.isArray(payload.data) ? payload.data : [];
    }

    function getAccentClasses(accent) {
        if (accent === 'rose') {
            return {
                category: 'text-rose-400',
                titleHover: 'group-hover:text-rose-300',
                buttonHover: 'hover:border-rose-500'
            };
        }
        if (accent === 'cyan') {
            return {
                category: 'text-cyan-400',
                titleHover: 'group-hover:text-cyan-300',
                buttonHover: 'hover:border-cyan-500'
            };
        }
        return {
            category: 'text-slate-500',
            titleHover: 'group-hover:text-slate-900',
            buttonHover: 'hover:border-slate-900'
        };
    }

    function renderProgramCard(program) {
        const status = normalizeStatus(program.status);
        const statusMeta = STATUS_META[status];
        const accent = getAccentClasses(statusMeta.accent);
        const slug = normalizeSlug(program.slug);
        const recommended = Number(program.is_recommended) === 1;
        const preparingClasses = status === 'preparing' ? ' opacity-80 hover:opacity-100' : '';
        const modalAction = slug ? `onclick="openMdModal('${slug}')"` : 'disabled aria-disabled="true"';
        const disabledClasses = slug ? '' : ' opacity-50 cursor-not-allowed';

        return `
            <div class="prog-card ${status} snap-center flex-shrink-0 w-[85vw] min-w-[280px] md:w-[calc(33.333%-1rem)] md:min-w-[340px] h-full rounded-3xl p-8 bg-transparent border-[1.331px] border-black/[0.1331] flex flex-col justify-between transition-all duration-300 group relative${preparingClasses}">
                ${recommended ? '<div class="absolute -top-3 right-6 z-50 px-3 py-1 rounded-full bg-[rgba(55,65,81,0.15)] text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider">RECOMMENDED</div>' : ''}
                <div>
                    <div class="flex items-center justify-between mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-transparent border-[1.331px] border-black/[0.1331] flex items-center justify-center ${statusMeta.iconTone}">
                            ${escapeHtml(program.icon || '🎓')}
                        </div>
                        <span class="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
                            ${statusMeta.label}
                        </span>
                    </div>
                    <span class="font-mono text-[11px] ${accent.category} font-bold uppercase tracking-wider block mb-2">${escapeHtml(program.category || 'Mission Program')}</span>
                    <h3 class="text-xl font-bold text-white mb-3 ${accent.titleHover} transition-colors">${escapeHtml(program.title || '프로그램 안내')}</h3>
                    <p class="text-slate-400 text-xs sm:text-sm leading-relaxed font-light mb-8 line-clamp-3 min-h-[4.5rem]">
                        ${escapeHtml(program.description || '')}
                    </p>
                </div>
                <button type="button" ${modalAction} class="group/program-action w-full py-3.5 rounded-2xl bg-transparent hover:bg-transparent border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white ${accent.buttonHover} transition-all flex items-center justify-center gap-2${disabledClasses}">
                    <span>자세히 보기 및 신청</span>
                    <i data-lucide="arrow-up-right" class="w-4 h-4 transition-transform duration-200 group-hover/program-action:translate-x-0.5 group-hover/program-action:-translate-y-0.5"></i>
                </button>
            </div>`;
    }

    function setSliderControlsEnabled(enabled) {
        ['prog-prev', 'prog-next'].forEach(function (id) {
            const button = document.getElementById(id);
            if (!button) return;
            button.disabled = !enabled;
            button.style.visibility = enabled ? '' : 'hidden';
        });
    }

    function renderState(container, message, tone) {
        const colorClass = tone === 'error' ? 'text-rose-600' : 'text-slate-500';
        container.innerHTML = `<div class="w-full min-h-[180px] flex items-center justify-center text-center ${colorClass} text-sm">${escapeHtml(message)}</div>`;
        setSliderControlsEnabled(false);
    }

    async function loadPrograms() {
        const container = document.getElementById('prog-slider');
        if (!container || !window.KWaveApi || !window.KWaveApi.api) return;

        renderState(container, '프로그램을 불러오는 중입니다...', 'loading');

        try {
            const response = await window.KWaveApi.api.get('/api/get-programs');
            const programs = unwrapItems(response);

            if (!programs.length) {
                renderState(container, '등록된 프로그램이 없습니다.', 'empty');
                return;
            }

            container.innerHTML = programs.map(renderProgramCard).join('');
            setSliderControlsEnabled(programs.length > 1);

            if (window.lucide) {
                window.lucide.createIcons();
            }

            const activeButton = document.querySelector('.prog-filter-btn.active') || document.querySelector('.prog-filter-btn');
            const activeType = activeButton && activeButton.getAttribute('onclick')?.match(/filterPrograms\('([^']+)'/)?.[1] || 'all';
            if (typeof window.filterPrograms === 'function') {
                window.filterPrograms(activeType, activeButton);
            }
        } catch (error) {
            renderState(container, '프로그램 정보를 불러오지 못했습니다.', 'error');
            console.error('Program loading failed:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadPrograms);
    window.ProgramLoader = { load: loadPrograms };
})();
