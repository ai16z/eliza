# Eliza 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />
</div>

<div align="center">

📖 [문서](https://elizaos.github.io/eliza/) | 🎯 [예시](https://github.com/thejoven/awesome-eliza)

</div>

## ✨ 기능

- 🛠 SNS 통합 지원: Discord, Twitter, Telegram을 모두 지원합니다.
- 🔗 다양한 모델 호환: Llama, Grok, OpenAI, Anthropic 등 다양한 AI 모델을 지원합니다.
- 👥 다중 에이전트 및 채팅방 지원: 여러 에이전트와 채팅방을 손쉽게 관리할 수 있습니다.
- 📚 문서 처리 및 상호작용: 데이터를 손쉽게 추가하고 활용할 수 있는 기능을 제공합니다.
- 💾 검색 가능한 메모리 및 문서 저장소: 데이터를 빠르고 간편하게 검색하고 액세스할 수 있습니다.
- 🚀 높은 확장성: 사용자 정의 동작 및 클라이언트를 만들어 기능을 확장할 수 있습니다.
- ☁️ 다양한 AI 모델 지원: Local Llama, OpenAI, Anthropic, Groq 등과 호환됩니다.
- 📦 쉽게 시작하세요: 바로 작동하며 손쉽게 활용할 수 있습니다!

## 비디오 튜토리얼

[AI Agent Dev School](https://www.youtube.com/watch?v=ArptLpQiKfI&list=PLx5pnFXdPTRzWla0RaOxALTSTnVq53fKL)

## 🎯 eliza로 어떤걸 만들 수 있을까요?

- 🤖 챗봇 개발
- 🕵 ️AI가 자율적으로 결과를 만들어줘요!
- 📈 업무처리 자동화
- 🎮 비디오 게임 NPC
- 🧠 트레이딩

## 🚀 빠른 시작

### 필수 요구사항:

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23.3+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

> **Windows 사용자 참고:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual)가 필요합니다.

### Starter 사용 (권장)

```bash
git clone https://github.com/elizaos/eliza-starter.git
cd eliza-starter
cp .env.example .env
pnpm i && pnpm build && pnpm start
```
에이전트가 실행되면 마지막에 "pnpm start:client"를 실행하라는 메시지가 표시됩니다. 
다른 터미널을 열고 같은 디렉토리로 이동한 뒤 아래 명령어를 실행하세요. 표시된 URL을 열어 에이전트와 대화하세요.
```bash
pnpm start:client
```

[문서](https://elizaos.github.io/eliza/)를 참고하여 Eliza를 커스터마이징하는 방법을 배워보세요.

### Eliza를 수동으로 실행하기 (경험자에게만 권장)

```bash
# 리포지토리 클론
git clone https://github.com/elizaos/eliza.git

# 최신 릴리스로 체크아웃
# 프로젝트가 빠르게 수정되므로 최신 릴리스를 체크아웃하는 것을 권장합니다.
git checkout $(git describe --tags --abbrev=0)
```

### Gitpod로 Eliza 시작

[![Gitpod로 열기](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/elizaos/eliza/tree/main)

### .env 파일 편집

.env.example을 복사해서 필요한 값들을 채워넣어 .env파일을 만드세요.

```
cp .env.example .env
```

참고: .env는 선택 사항입니다. 여러 개의 에이전트를 실행하려는 경우, 캐릭터 JSON 파일을 통해 비밀 변수를 전달할 수 있습니다.

### Eliza 자동 시작

아래 명령은 프로젝트를 설정하고 기본 캐릭터와 함께 봇을 시작합니다.

```bash
sh scripts/start.sh
```

### character file 편집

1. `agent/src/character.ts`를 열어 기본 캐릭터를 수정하세요. 주석을 해제하고 수정하시면 됩니다.

2. 커스텀 캐릭터 로드하기:
    - `pnpm start --characters="path/to/your/character.json"`을 사용합니다.
    - 여러 캐릭터 파일을 동시에 로드할 수 있습니다.
3. X (Twitter) 연결:
    - 캐릭터 파일에서 `"clients": []`를 `"clients": ["twitter"]`로 변경합니다.

### Eliza 수동 시작

```bash
pnpm i
pnpm build
pnpm start

# 프로젝트가 빠르게 수정되므로 프로젝트를 clean해야 할 수도 있습니다.
pnpm clean
```

#### 추가 요구 사항

시작할 때 오류가 발생하면 Sharp를 설치해야 할 수도 있습니다. 아래 명령어를 실행하여 설치하세요:

```
pnpm install --include=optional sharp
```

### 커뮤니티 & 문의

- [Github Issues](https://github.com/elizaos/eliza/issues). liza 사용 중 발견된 버그 보고 및 기능 제안에 적합합니다.
- [Discord](https://discord.gg/ai16z). 애플리케이션 공유 및 커뮤니티와의 소통에 적합합니다.

## 컨트리뷰터

<a href="https://github.com/elizaos/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elizaos/eliza" />
</a>

## 스타 기록

[![Star History Chart](https://api.star-history.com/svg?repos=elizaos/eliza&type=Date)](https://star-history.com/#elizaos/eliza&Date)
