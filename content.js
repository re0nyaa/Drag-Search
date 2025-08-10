let searchButton = null;
let selectedText = "";
let selectionTimer = null;
let extensionEnabled = true;

// 확장 프로그램 상태 로드
chrome.storage.sync.get(["extensionEnabled"], function (result) {
    extensionEnabled = result.extensionEnabled !== false; // 기본값은 true
});

// 메시지 리스너 추가 (토글 상태 변경 시)
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "toggleExtension") {
        extensionEnabled = request.enabled;
        if (!extensionEnabled) {
            hideSearchButton(); // 비활성화 시 검색 버튼 숨기기
        }
    }
});

// 검색 엔진 설정 (svg)
const SEARCH_ENGINES = {
    google: {
        name: "Google",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" width="14" height="14">
          <path fill="#4285F4" d="M488 261.8c0-17.5-1.6-35.5-4.7-52.5H249v99.3h134.6c-5.8 31.3-23.8 57.8-50.5 75.5v62.7h81.4c47.6-43.8 74.5-108.4 74.5-184z"/>
          <path fill="#34A853" d="M249 492c67.7 0 124.6-22.5 166-61.1l-81.4-62.7c-22.6 15.2-51.7 24.1-84.6 24.1-65 0-120.1-43.8-139.7-102.6H25v64.4C66.4 438.6 151.6 492 249 492z"/>
          <path fill="#FBBC05" d="M109.3 289.7c-4.7-14.1-7.4-29.2-7.4-44.7s2.7-30.6 7.4-44.7V136h-84.3C9.1 169.9 0 208.9 0 248.9s9.1 79 25 112.9l84.3-72.1z"/>
          <path fill="#EA4335" d="M249 97.9c37 0 70.2 12.8 96.4 37.8l72-72C373.5 24.6 316.7 0 249 0 151.6 0 66.4 53.4 25 136l84.3 64.4C128.9 141.7 184 97.9 249 97.9z"/>
        </svg>`,
        url: (q) => `https://www.google.com/search?q=${q}`,
    },
    naver: {
        name: "Naver",
        icon: `<svg fill="#2DB400" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
        </svg>`,
        url: (q) => `https://search.naver.com/search.naver?query=${q}`,
    },
    youtube: {
        name: "YouTube",
        icon: `<svg
                                viewBox="0 0 576 512"
                                height="18px"
                                width="18px"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fill="#c4302b"
                                    d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305z"
                                ></path>
                                <polygon
                                    fill="#ffffff"
                                    points="232,336 232,176 374.739,256"
                                ></polygon>
                            </svg>`,
        url: (q) => `https://www.youtube.com/results?search_query=${q}`,
    },
    namuwiki: {
        name: "나무위키",
        icon: `<svg stroke="#0CAB9E" fill="#0CAB9E" stroke-width="0" role="img" viewBox="0 0 24 24" height="15px" width="15px" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.3724 0 0 5.372 0 12c0 6.6278 5.3723 12 12 12 6.6278 0 12-5.3722 12-12 0-6.628-5.3722-12-12-12zM6.4902 5.9219c1.1467-.0082 2.0869.918 2.0957 2.0644.005.6836-.324 1.2912-.832 1.6739l1.7871 4.2207 2.959-1.252-.3848-.9082c-.0923.013-.1852.0228-.2812.0234-1.1466.0088-2.0868-.9182-2.0957-2.0644-.0087-1.1472.9177-2.085 2.0644-2.0938 1.1466-.0081 2.087.9168 2.0957 2.0625.0048.655-.2955 1.2423-.7675 1.627l1.125 2.6562 3.5293-1.496a2.0834 2.0834 0 0 1-.045-.4122c-.0085-1.147.9178-2.0868 2.0645-2.0957 1.1465-.0088 2.0851.9163 2.0937 2.0625.0085 1.1473-.9162 2.0879-2.0625 2.0957-.6053.0044-1.1519-.2535-1.5351-.664l-3.6133 1.5293.496 1.1738a.5542.5542 0 0 1-.2929.7266.5546.5546 0 0 1-.7265-.295l-1.2305-2.9082-4.8828 2.0664c.0112.0845.0189.1702.0195.2559.0085 1.147-.9178 2.0863-2.0644 2.0957-1.146.0081-2.0875-.9174-2.0957-2.0644-.0088-1.1465.9176-2.0861 2.0644-2.0957.6647-.005 1.258.3045 1.6426.789l.9043-.3828-1.7969-4.2441a1.9538 1.9538 0 0 1-.2012.0117c-1.1467.0092-2.087-.916-2.0957-2.0625-.0087-1.1462.9159-2.087 2.0625-2.0957zM6.5 7.1406c-.4749.0036-.8573.3933-.8535.8672.0035.475.3925.8572.8672.8535.474-.0031.8573-.3927.8535-.8672-.0037-.4745-.393-.8574-.8672-.8535zm5.3125 1.6621c-.4749.0043-.859.3928-.8555.8672.0033.4745.3932.8571.8672.8535.4749-.0034.859-.3908.8555-.8652-.0035-.4739-.393-.8585-.8672-.8555zm7.957 2.3438c-.4537.0267-.8137.4075-.8105.8672.0034.4743.3924.8565.8672.8535.474-.0036.8565-.3922.8535-.8672-.0044-.474-.393-.8567-.8672-.8535-.0148.0001-.0283-.0009-.043 0zM5.9844 15.125c-.4749.0049-.8576.393-.8535.8672a.8613.8613 0 0 0 .8652.8555c.4739-.0036.8568-.3935.8535-.8672-.0036-.474-.3911-.8586-.8652-.8555z"></path></svg>`,
        url: (q) => `https://namu.wiki/Search?q=${q}`,
    },
};

// 텍스트 드래그 감지
document.addEventListener("mouseup", onTextSelection);
document.addEventListener("keyup", onTextSelection);
document.addEventListener("click", hideSearchButton);

function onTextSelection(e) {
    // 확장 프로그램이 비활성화된 경우 무시
    if (!extensionEnabled) {
        return;
    }

    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
        const text = window.getSelection().toString().trim();
        if (text) {
            selectedText = text;
            showSearchButton(e.pageX, e.pageY);
        } else {
            hideSearchButton();
        }
    }, 150); // 중복 무시
}

function showSearchButton(x, y) {
    // 확장 프로그램이 비활성화된 경우 무시
    if (!extensionEnabled) {
        return;
    }

    hideSearchButton();

    chrome.storage.sync.get(
        "defaultSearchEngine",
        ({ defaultSearchEngine }) => {
            const engine =
                SEARCH_ENGINES[defaultSearchEngine] || SEARCH_ENGINES.google;

            // 버튼 생성
            searchButton = document.createElement("div");
            searchButton.id = "text-search-button";
            searchButton.innerHTML = `
            <div class="search-tooltip">
                <button class="search-btn" data-engine="${engine.name}">
                    ${engine.icon}
                </button>
            </div>
        `;
            Object.assign(searchButton.style, {
                position: "absolute",
                left: `${x}px`,
                top: `${y + 20}px`,
                zIndex: "10000",
            });

            document.body.appendChild(searchButton);

            searchButton
                .querySelector(".search-btn")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    const query = encodeURIComponent(selectedText);
                    window.open(engine.url(query), "_blank");
                    hideSearchButton();
                    window.getSelection().removeAllRanges();
                });

            adjustPosition();
        }
    );
}

function hideSearchButton() {
    if (searchButton) {
        searchButton.remove();
        searchButton = null;
    }
}

// 위치 조정
function adjustPosition() {
    if (!searchButton) return;
    const rect = searchButton.getBoundingClientRect();

    if (rect.right > window.innerWidth) {
        searchButton.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        searchButton.style.top = `${
            parseInt(searchButton.style.top) - rect.height - 40
        }px`;
    }
    if (rect.left < 0) searchButton.style.left = "10px";
    if (rect.top < 0) searchButton.style.top = "10px";
}
