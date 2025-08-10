document.addEventListener("DOMContentLoaded", function () {
    loadSearchEngineSetting();
    loadExtensionToggleSetting();

    // 검색 엔진 변경 이벤트 리스너 추가
    const radioButtons = document.querySelectorAll(
        'input[name="searchEngine"]'
    );
    radioButtons.forEach((radio) => {
        radio.addEventListener("change", saveSearchEngineSetting);
    });

    // 확장 프로그램 토글 이벤트 리스너 추가
    const extensionToggle = document.getElementById("extensionToggle");
    extensionToggle.addEventListener("change", saveExtensionToggleSetting);
});

// 검색 엔진 설정 저장
function saveSearchEngineSetting() {
    const selectedEngine = document.querySelector(
        'input[name="searchEngine"]:checked'
    ).value;
    chrome.storage.sync.set(
        { defaultSearchEngine: selectedEngine },
        function () {
            console.log("검색 엔진 설정 저장됨:", selectedEngine);
        }
    );
}

// 검색 엔진 설정 로드
function loadSearchEngineSetting() {
    chrome.storage.sync.get(["defaultSearchEngine"], function (result) {
        const defaultEngine = result.defaultSearchEngine || "google";
        const radioButton = document.querySelector(
            `input[name="searchEngine"][value="${defaultEngine}"]`
        );
        if (radioButton) {
            radioButton.checked = true;
        }
        console.log("검색 엔진 설정 로드돰", defaultEngine);
    });
}

// 확장 프로그램 토글 설정 저장
function saveExtensionToggleSetting() {
    const isEnabled = document.getElementById("extensionToggle").checked;
    chrome.storage.sync.set({ extensionEnabled: isEnabled }, function () {
        console.log("확장 프로그램 토글 설정 저장됨:", isEnabled);
        updateToggleStatus(isEnabled);

        // content script에 상태 전달
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "toggleExtension",
                        enabled: isEnabled,
                    });
                }
            }
        );
    });
}

// 확장 프로그램 토글 설정 로드
function loadExtensionToggleSetting() {
    chrome.storage.sync.get(["extensionEnabled"], function (result) {
        const isEnabled = result.extensionEnabled !== false; // 기본값은 true
        const toggle = document.getElementById("extensionToggle");
        toggle.checked = isEnabled;
        updateToggleStatus(isEnabled);
        console.log("확장 프로그램 토글 설정 로드됨:", isEnabled);
    });
}

// 토글 상태 텍스트 업데이트
function updateToggleStatus(isEnabled) {
    const statusElement = document.getElementById("extensionStatus");
    if (isEnabled) {
        statusElement.textContent = "확장 프로그램이 활성화되었습니다.";
        statusElement.style.color = "#2ecc71";
    } else {
        statusElement.textContent = "확장 프로그램이 비활성화되었습니다.";
        statusElement.style.color = "#e74c3c";
    }
}
