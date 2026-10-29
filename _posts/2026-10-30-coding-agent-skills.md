---
layout: post
title: "요즘 잘 쓰고 있는 코딩 에이전트 스킬 2가지: Cloudflare security-audit & Ponytail"
categories: [ AI, Development ]
---

2026년 10월 30일 · @gongsoonyee

## 들어가며

최근 코딩 에이전트에 붙여 쓴 스킬 중 체감이 컸던 두 가지를 정리합니다. 하나는 코드베이스 보안 감사를 맡기는 Cloudflare의 security-audit, 다른 하나는 에이전트가 코드를 덜, 그러나 제대로 쓰게 만드는 Ponytail입니다.

에이전트 스킬은 `SKILL.md`를 중심으로 한 지시문·참고 문서·스크립트 묶음입니다. 에이전트는 요청이 스킬의 설명과 맞을 때 이 파일을 읽고 그 절차대로 일합니다. 모델을 바꾸지 않고도 "일하는 방식"을 바꿀 수 있다는 게 핵심입니다.

두 스킬은 성격이 정반대라 같이 쓰기 좋습니다. security-audit는 시간을 들여 깊게 파고, Ponytail은 매 작업마다 군더더기를 걷어냅니다.

## 1. Cloudflare security-audit: 에이전트를 보안 감사관으로

security-audit는 코딩 에이전트를 보안 감사관으로 바꿔주는 스킬입니다. Cloudflare가 사내 취약점 탐지 하네스를 만들 때 출발점으로 삼은 스킬을 단일 저장소용으로 공개한 것이고, MIT 라이선스입니다.

### 어떻게 동작하나: 6단계 감사

핵심은 서로 격리된 여러 서브 에이전트가 단계별로 역할을 나눠 맡는다는 점입니다.

1. **정찰(Reconnaissance)** — 아키텍처, 신뢰 경계, 입력 지점을 파악해 `architecture.md`와 `coverage-ledger.json`(커버리지 장부)에 기록합니다.
2. **커버리지 기반 헌팅** — 장부의 단위별로 격리된 헌터 에이전트를 배정하고, 별도의 "커버리지 비평가"가 빠진 곳을 찾습니다.
3. **후보 검증** — 발견한 후보마다 새 검증 에이전트가 붙어 반박을 시도합니다.
4. **구조화 출력** — 결과를 `confirmed` / `needs_validation` / `rejected`로 나눠 `findings.json`에 쓰고 JSON 스키마로 검증합니다.
5. **독립 기록 검증** — 또 다른 새 에이전트가 최종 소스 근거를 다시 확인합니다.
6. **리포트 생성** — 검증된 기록으로 `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`를 만듭니다.

세 가지 판정은 의미가 분명합니다. `confirmed`는 소스 추적과 결과가 완결된 것, `needs_validation`은 미확인 사실이 하나 남아 심각도를 매기지 않은 것, `rejected`는 반박된 후보입니다.

공격 유형별 참고 문서도 따로 들어 있습니다. 웹·인증 프로토콜, 클라이언트 사이드, 공급망·릴리스, 클라우드·배포, LLM 프롬프트 인젝션, 메모리 안전성, 데이터 격리, 모바일·로컬 IPC 등을 대상에 맞게 골라 읽습니다.

### 설계 원칙에서 배울 점

- **찾은 에이전트가 검증하지 않는다.** 검증은 항상 다른 에이전트가 맡아 확증 편향을 줄입니다.
- **심각도는 영향으로 매긴다.** 체크리스트 위반이 아니라 발생 가능성 × 영향입니다.
- **다층 방어의 빈틈은 취약점이 아니다.** A층이 막고 있으면 B층 부재는 "하드닝 노트"로 분류합니다.
- **여러 번 돌릴수록 좋아진다.** Cloudflare 테스트에서 1회 실행은 반복 실행 전체 발견량의 약 절반을 찾았습니다. 실행 결과는 누적되어 다음 실행이 빈 곳을 집중 공략합니다.

### 세팅 방법

Skills CLI로 한 줄이면 설치됩니다.

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit
```

모든 프로젝트에서 쓰려면 `--global`을 붙여 사용자 단위로 설치합니다.

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit \
  --global
```

에이전트 선택이나 비대화형 옵션은 `npx skills --help`로 확인합니다.

### 요구사항

| 항목 | 내용 |
| --- | --- |
| 에이전트 | 도구 사용과 병렬 서브 에이전트를 지원하는 모델 |
| Node.js | 의존성 없는 검증기(`validate-findings.cjs`, `validate-coverage-ledger.cjs`) 실행용 |
| 샌드박스 | 대상 코드 빌드·테스트·실행용. 외부 네트워크 차단, 환경변수 허용목록, 리소스 제한, 지정 경로만 쓰기 허용 |

샌드박스가 없으면 대상 코드를 실행하지 않고, 실행으로만 확인 가능한 건은 `needs_validation`으로 남깁니다. 안전하게 설계된 부분입니다.

### 사용법

감사할 코드베이스에서 에이전트를 띄우고 자연어로 요청하면 스킬이 자동으로 켜집니다.

```text
security audit this codebase
find security vulnerabilities in ./src
do a security review, output to ~/audits/my-project
```

코드베이스 전체 감사·펜테스트 요청은 풀 감사 모드, 보안 질문이나 특정 취약점 작업은 가이드 모드로 동작합니다. 출력 경로를 지정하지 않으면 `~/security-audit-skill/<repo-name>/run-<N>`에 결과가 쌓이고, 대상 저장소 안에는 버전관리에서 무시되는 경로를 명시했을 때만 씁니다.

**팁:** 1회 실행으로 끝내지 말고 2~3회 돌리세요. 이전 장부와 발견 내역을 이어받아 빈 곳을 메웁니다.

## 2. Ponytail: 가장 게으른 시니어 개발자를 에이전트 안에

Ponytail은 에이전트가 "방에서 가장 게으른 시니어 개발자"처럼 생각하게 만드는 스킬입니다. 슬로건은 "가장 좋은 코드는 쓰지 않은 코드". 50줄짜리 코드를 보고 말없이 한 줄로 바꿔버리는, 회사에 버전관리보다 오래 있었던 그 선배를 떠올리면 됩니다.

실체는 프롬프트 하나(`skills/ponytail/SKILL.md`)이고, 저장소의 나머지는 이 프롬프트를 Claude Code, Codex, Cursor, Copilot 등 20여 개 에이전트에 넣어주는 어댑터입니다.

### 어떻게 동작하나: 코드 작성 전 사다리

먼저 변경이 닿는 코드를 읽고 실제 흐름을 추적한 뒤, 아래 사다리를 위에서부터 내려가다 처음 성립하는 칸에서 멈춥니다.

1. 이게 정말 필요한가?
2. 이미 코드베이스에 있나?
3. 표준 라이브러리로 되나?
4. 플랫폼 기본 기능으로 되나?
5. 이미 설치된 의존성으로 되나?
6. 한 줄로 되나?
7. 그제서야 동작하는 최소한을 작성 (로직이 있으면 작은 테스트 하나 포함)

"해결책엔 게으르되 읽기엔 게으르지 않다"가 원칙입니다. 신뢰 경계 입력 검증, 데이터 손실 처리, 보안, 접근성은 절대 깎지 않습니다. 분기·루프·파서·금액·보안이 들어간 로직은 테스트를 남기고, 매 응답 끝에 건너뛴 것과 확인 못 한 리스크를 밝힙니다.

### 예시: 날짜 선택기

"프론트엔드에 날짜 선택기 추가해줘"라는 요청에 스킬 없는 에이전트는 라이브러리를 깔거나 달력을 직접 만들어 335줄을 썼습니다. Ponytail은 저장소의 기존 Input 컴포넌트에 `type="date"`를 붙여 브라우저 기본 달력을 쓰게 했고, 결과는 10줄이었습니다.

### 숫자로 본 효과 (Ponytail 5)

Claude Code에서 같은 에이전트를 스킬 유무로 비교한 벤치마크입니다(실제 FastAPI + React 저장소 포함 39개 작업, Opus 5.5, 작업당 5회).

| 지표 | 스킬 없음 대비 |
| --- | --- |
| 코드량 | -53% |
| 작업 시간 | -41% |
| 비용 | -26% |
| 출력 토큰 | -45% |
| 위험 로직에 테스트가 붙은 비율 | 98% (스킬 없음 68%) |

코드를 줄였는데도 보안 과제 6종(SQL 인젝션, 경로 탐색, 위조 토큰 등) 30회 실행을 모두 통과했습니다. 목표는 "최소 토큰"이 아니라 "필요한 것만"이고, 비용 절감은 부수 효과라는 게 제작자의 설명입니다. ([벤치마크 상세](https://github.com/DietrichGebert/ponytail/blob/main/benchmarks/results/2026-10-07-agentic.md))

### 세팅 방법

Claude Code — 프롬프트 두 번에 나눠 입력합니다.

```text
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Codex

```text
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```

설치 후 Codex에서 `/hooks`를 열어 두 개의 라이프사이클 훅을 신뢰 처리하고 새 스레드를 시작합니다.

그 외 에이전트 — 프로젝트에 `AGENTS.md`를 복사하거나, 에이전트에게 `skills/ponytail/SKILL.md`를 스킬로 설치해 달라고 하면 됩니다. Cursor, Copilot, OpenCode, Gemini 등은 저장소의 `INSTALL.md`에 단계별 안내가 있습니다.

별도 설정 파일은 필요 없습니다. 기본 강도를 바꾸고 싶을 때만 `~/.config/ponytail/config.json`이나 `PONYTAIL_DEFAULT_MODE` 환경변수를 씁니다.

> **주의:** 공식 배포처는 GitHub의 [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)과 npm의 `@dietrichgebert/ponytail`뿐입니다. `.exe`나 `.dll`이 들어 있는 사본은 가짜입니다.

### 주요 명령어

| 명령어 | 하는 일 |
| --- | --- |
| `/ponytail [lite \| full \| ultra \| off]` | 강도 조절 또는 끄기 |
| `/ponytail-review` | 현재 diff를 리뷰. diff 밖의 영향받는 코드까지 읽고 버그·보안·부하·테스트 누락·성능·삭제 대상을 짚음 |
| `/ponytail-audit` | 저장소 전체를 같은 기준으로 점검하고 "먼저 고칠 것" 순으로 정렬 |
| `/ponytail-debt` | 미뤄둔 `shortcut:` 주석을 모아 기술부채 장부로 정리 |
| `/ponytail-gain` | 벤치마크 기반 효과 지표 표시 |
| `/ponytail band [on \| off]` | Claude Code 프롬프트 위 비용·토큰·시간·재사용률 밴드 표시 토글 |
| `/ponytail-help` | 명령어 요약 |

명령어는 Claude Code, Codex, Gemini 같은 스킬 지원 호스트에서만 동작하고, Cursor 규칙 파일이나 Copilot 같은 지시문 전용 어댑터는 항상 켜진 규칙만 적용됩니다. 밴드는 Claude Code 2.1.290 이상의 터미널·데스크톱 앱에서 보이며, 기록은 기본적으로 로컬(`~/.config/ponytail/band/`)에만 저장됩니다.

## 3. 두 스킬을 함께 쓰는 법

일상 개발에는 Ponytail을 항상 켜 두고, 릴리스 전이나 주요 기능 머지 전에 security-audit를 돌리는 조합이 잘 맞았습니다.

| 구분 | Ponytail | security-audit |
| --- | --- | --- |
| 목적 | 불필요한 코드를 쓰지 않게 | 실제 취약점을 근거와 함께 찾기 |
| 실행 시점 | 매 작업, 항상 켜짐 | 릴리스 전 등 필요할 때, 여러 번 |
| 결과물 | 짧은 코드 + 테스트 + 리스크 메모 | `findings.json` + 리포트 3종 |
| 비용 감각 | 토큰·시간 절감 | 병렬 서브 에이전트로 시간·토큰 투자 |

`/ponytail-review`와 `/ponytail-audit`도 보안을 보긴 하지만 "코드 리뷰" 수준입니다. 공격 클래스별로 파고들어 반박 검증까지 거치는 깊이는 security-audit 쪽이 확실히 위입니다. 반대로 security-audit가 찾은 이슈를 고칠 때 Ponytail이 켜져 있으면 수정 범위가 과하게 커지는 걸 막아줍니다.

## 마무리

두 스킬 모두 모델을 바꾸지 않고 "일하는 방식"만 바꿔서 결과를 끌어올린다는 점이 인상적이었습니다. 하나는 더 깊게, 하나는 더 적게. 설치는 각각 명령 두 줄이면 끝나니 가볍게 붙여보길 권합니다.

## 참고 링크

- [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)
- [Cloudflare 블로그: Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness/)
- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [Ponytail 벤치마크 결과](https://github.com/DietrichGebert/ponytail/blob/main/benchmarks/results/2026-10-07-agentic.md)
