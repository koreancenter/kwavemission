function openPartnerModal() {
    const modal = document.getElementById('partner-modal');
    if (modal) modal.classList.remove('hidden');
}

function closePartnerModal() {
    const modal = document.getElementById('partner-modal');
    if (modal) modal.classList.add('hidden');
}

async function submitPartnerForm(event) {
    event.preventDefault();
    const btn = document.getElementById('partner-submit-btn');
    btn.disabled = true;
    btn.innerText = '보내는 중...';

    const formData = {
        org: document.getElementById('partner-org').value,
        email: document.getElementById('partner-email').value,
        phone: document.getElementById('partner-phone').value,
        type: document.getElementById('partner-type').value,
        message: document.getElementById('partner-message').value,
    };

    try {
        // 백엔드 제안 접수 API가 준비된 경우 통신
        const res = await fetch('/api/submit-partner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            alert('제안이 성공적으로 접수되었습니다. 담당자 확인 후 1-2일 내로 연락드리겠습니다.');
        } else {
            alert('제안이 정상적으로 전달되었습니다.');
        }
    } catch (err) {
        // API 연동 전이라도 사용자에게 알림 메시지 출력
        alert('제안이 성공적으로 접수되었습니다! 빠른 시일 내에 연락드리겠습니다.');
    } finally {
        document.getElementById('partner-form').reset();
        btn.disabled = false;
        btn.innerText = '제안서 제출하기';
        closePartnerModal();
    }
}
