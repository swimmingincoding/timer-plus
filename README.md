# ⏱️ Timer+ (TimerPlus 모바일 운동 타이머 PWA)

아이폰(iOS)과 안드로이드에서 널리 사용되는 고성능 운동 타이머 어플리케이션 **"TimerPlus"**의 핵심 기능과 UI/UX를 모바일 웹 및 **PWA(Progressive Web App)** 형태로 구현한 프로젝트입니다.

네트워크 연결이 없는 헬스장, 지하, 비행기 모드에서도 **100% 오프라인**으로 작동하며, **Netlify**를 통해 1분 만에 무료로 배포하고 스마트폰 홈 화면에 추가하여 네이티브 앱처럼 사용할 수 있습니다.

---

## ✨ 3대 핵심 운동 모드 (하단 탭 메뉴)

화면 하단 탭 메뉴를 통해 실제 **TimerPlus** 어플과 동일한 **3가지 타이머 모드**를 즉시 전환하며 사용할 수 있습니다:

### 1. ⏱️ 인터벌 / 타바타 모드 (Interval)
- **타바타 (Tabata)**: 20초 운동 / 10초 휴식 8라운드 (총 4분)
- **고강도 HIIT 서킷**: 45초 운동 / 15초 휴식, 다중 세트 및 세트 간 휴식 지원
- **EMOM (매 1분 반복)** & **스트레칭 30초 릴레이**
- **맞춤 루틴 생성/편집**: 운동 시간, 휴식 시간, 라운드, 세트, 세트 간 휴식, 준비 시간 커스텀
- "다음 단계 미리보기", 원형 SVG 진행률 다이얼, 전체 진행률 바

### 2. 🥊 복싱 & 격투기 라운드 모드 (Rounds)
- **프로 복싱 (3분 × 12R)**, **아마추어 복싱 (3분 × 3R)**, **MMA (5분 × 5R)**, **섀도우 복싱 (2분 × 5R)**
- **라운드 시작/종료 벨소리**: 실제 경기장 공 소리(Boxing Bell) 재현
- **10초 전 경고음**: 라운드 종료 10초 전 나무 타격음(Wood Clapper) 알림
- 대형 라운드 카운터 (`ROUND 1 / 5`) 및 현재 상태(`FIGHT` / `REST`) 직관적 표시

### 3. ⏱️ 정밀 스톱워치 모드 (Stopwatch)
- **1/100초(밀리초) 정밀 계측**: 대형 디지털 타이머 (`00:00.00`)
- **구간 기록(Lap Time) & 누적 시간(Split Time)** 실시간 기록
- **랩 분석 기능**: 가장 빠른 랩(초록색 `최고`)과 가장 느린 랩(빨간색 `최저`) 자동 감지 및 시각화
- 랩 타임 목록 부드러운 스크롤 및 1-터치 초기화

3. **운동 특화 스마트 기능**
   - 🎧 **에어팟 / 블루투스 이어폰 버튼 연동 (Media Session API)**: 땀 묻은 손으로 스마트폰을 만지지 않고도 에어팟/갤럭시 버즈의 터치/버튼 클릭 또는 잠금화면 위젯으로 타이머 시작/일시정지 및 라운드 넘기기 가능
   - ⌨️ **키보드 단축키 완벽 지원 (PC / 태블릿)**:
     - `Space`: 시작 / 일시정지
     - `← / →`: 이전 단계 / 다음 단계 스킵 (스톱워치에서는 랩 기록)
     - `R`: 타이머 즉시 초기화
     - `M`: 소리 음소거 토글
     - `1, 2, 3`: 인터벌 / 라운드 / 스톱워치 탭 원터치 전환
   - 💡 **화면 꺼짐 방지 (Screen Wake Lock API)**: 운동 중 스마트폰 화면이 절전 모드로 꺼지지 않고 계속 켜져 있음
   - 🔔 **내장 Web Audio 신시사이저**: 외부 오디오 파일 다운로드 없이 100% 오프라인에서 즉시 울리는 카운트다운(3-2-1) 비프음, 복싱 링 벨 소리, 10초 전 나무 타격음(Wood Clapper)
   - 🗣️ **음성 안내 (Web Speech API)**: "준비", "시작", "휴식", "운동 완료" 등 한국어 음성 큐 지원
   - 📳 **진동 피드백 (Vibration API)**: 라운드 전환 및 카운트다운 시 촉각 진동 안내

4. **100% 오프라인 PWA 지원**
   - 서비스 워커(`sw.js`)와 웹 앱 매니페스트(`manifest.webmanifest`) 내장
   - 인터넷 연결이 완전히 끊겨도 캐시된 자원으로 즉시 구동

---

## 🚀 Netlify에 무료 배포하는 방법

Netlify의 무료 플랜(Free Tier)으로 누구나 평생 무료 호스팅 및 HTTPS 도메인을 받을 수 있습니다.

### 방법 1: Netlify Drop (가장 쉽고 빠른 방법 - 추천 ⭐️)

1. [Netlify 공식 사이트](https://www.netlify.com/)에 접속하여 무료 계정으로 로그인합니다.
2. 상단 메뉴의 **"Sites"** 탭으로 이동합니다.
3. 페이지 하단의 **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"** 영역을 찾습니다.
4. 본 프로젝트 폴더(`timer_plus` 전체 폴더)를 브라우저 드롭 영역으로 그대로 드래그 앤 드롭합니다.
5. 10초 이내에 무료 HTTPS 주소(예: `https://sparkling-timerplus-12345.netlify.app`)가 생성되며 배포가 완료됩니다!
6. *선택 사항*: `Site configuration` > `Change site name`에서 원하는 이름(예: `my-timerplus.netlify.app`)으로 주소를 변경할 수 있습니다.

---

### 방법 2: GitHub 연동 자동 배포 (코드 수정 시 자동 업데이트)

1. 본 폴더의 파일들을 본인의 GitHub 저장소에 Push합니다.
   ```bash
   git init
   git add .
   git commit -m "feat: TimerPlus PWA init"
   git remote add origin <본인-깃허브-레포-URL>
   git push -u origin main
   ```
2. Netlify 대시보드에서 **"Add new site"** > **"Import an existing project"** 클릭
3. **GitHub**를 선택하고 해당 저장소를 지정합니다.
4. 빌드 설정은 기본값 그대로 둡니다 (정적 사이트이므로 Build command는 비워두고 Publish directory는 `.` 또는 비움).
5. **"Deploy site"**를 누르면 자동으로 배포됩니다.

---

### 방법 3: Netlify CLI로 터미널에서 즉시 배포

```bash
# Netlify CLI로 로그인
npx netlify login

# 프로덕션 배포 실행
npx netlify deploy --prod --dir=.
```

---

## 📱 스마트폰 홈 화면에 추가하여 앱으로 쓰는 방법

배포된 Netlify 주소로 스마트폰에서 접속한 뒤 다음과 같이 진행합니다.

### 🍏 아이폰 (iOS Safari)
1. **Safari** 브라우저로 배포된 URL에 접속합니다.
2. 하단 중앙의 **공유 버튼** (네모 위로 뻗은 화살표 `⎋`)을 누릅니다.
3. 메뉴 목록에서 스크롤하여 **'홈 화면에 추가 (Add to Home Screen)'**를 선택합니다.
4. 우측 상단의 **'추가'**를 누르면 홈 화면에 예쁜 Timer+ 앱 아이콘이 생성됩니다.
5. 홈 화면 아이콘을 누르면 사파리 주소창 없이 **진짜 네이티브 앱처럼 풀스크린**으로 실행되며, 비행기 모드나 오프라인에서도 작동합니다.

### 🤖 안드로이드 (Android Chrome / Samsung Internet)
1. **Chrome** 또는 **삼성 인터넷**으로 배포된 URL에 접속합니다.
2. 화면 하단에 자동으로 표시되는 **'홈 화면에 앱 설치'** 배너의 **[설치]** 버튼을 누르거나,
3. 우측 상단 더보기(`⋮`) 메뉴 > **'홈 화면에 추가'** 또는 **'앱 설치'**를 선택합니다.
4. 홈 화면 및 앱스 서랍에 네이티브 앱처럼 설치되어 오프라인에서도 구동됩니다.

---

## 📂 파일 구조

```
timer_plus/
├── index.html              # 시맨틱 PWA 마크업 & 모바일 최적화 뷰포트
├── manifest.webmanifest    # PWA 스탠드얼론 앱 설정 및 메타데이터
├── sw.js                   # 100% 오프라인 캐싱 서비스 워커
├── netlify.toml            # Netlify 배포 및 서비스워커 캐시 제어 헤더
├── css/
│   └── style.css           # 고대비 애슬레틱 다크 테마 & 반응형 스타일
├── js/
│   ├── app.js              # UI 인터랙션, WakeLock, 설치 프롬프트 제어
│   ├── audio.js            # 순수 Web Audio API 사운드 합성 엔진 & TTS
│   ├── timer.js            # 타임스탬프 델타 기반 고정밀 인터벌 타이머
│   └── storage.js          # 루틴 프리셋 관리 및 로컬 저장소(localStorage)
└── icons/
    ├── icon.svg            # 벡터 앱 아이콘
    ├── favicon.svg         # 브라우저 탭 아이콘
    ├── icon-192.png        # PWA 192x192 아이콘
    ├── icon-512.png        # PWA 512x512 아이콘
    └── apple-touch-icon.png# iOS 홈 화면 전용 터치 아이콘
```
