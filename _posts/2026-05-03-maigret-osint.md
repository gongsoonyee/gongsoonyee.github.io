---
layout: post
title: "닉네임 하나로 수천 개 사이트를 뒤지는 OSINT 도구, Maigret 사용기"
categories: [ Development ]
tags: [ 보안, OSINT, 파이썬, Maigret, 정보수집 ]
---

2026년 5월 3일 · @gongsoonyee

## 들어가며

인터넷을 오래 쓴 사람이라면 대부분 몇 개의 닉네임을 돌려 쓴다. 깃허브, 커뮤니티, 게임, 쇼핑몰까지 같은 아이디를 쓰는 경우가 흔하다. 편리하지만, 보안 관점에서 보면 이 습관은 하나의 "지문"이 된다. 닉네임 하나만 알면 그 사람이 활동하는 여러 플랫폼을 이어 붙일 수 있기 때문이다.

이렇게 공개된 정보를 모아 분석하는 활동을 OSINT(Open Source Intelligence, 공개 출처 정보 수집) 라고 부른다. 레드팀 정찰, SOC 분석가의 위협 행위자 프로파일링, 위협 인텔리전스 연구에서 기본기로 꼽히는 분야다. 이번 글에서는 그중 "사용자명 열거(username enumeration)" 계열의 대표 도구인 Maigret을 정리해 본다.

## Maigret이란?

Maigret은 사용자명 하나만으로 수많은 사이트에서 계정 존재 여부를 확인하고, 프로필 페이지에서 얻을 수 있는 정보를 모아 일종의 "도시에(dossier)"를 만들어 주는 오픈소스 파이썬 도구다. 개발자는 soxoj이며 MIT 라이선스로 공개되어 있고, API 키 없이 동작한다는 점이 특징이다. 이름은 조르주 심농의 추리소설 속 형사 메그레(Maigret)에서 따왔다.

출발점은 유명한 Sherlock 프로젝트의 포크였지만, 지금은 기능 면에서 훨씬 확장된 별개의 도구로 자리 잡았다. 2026년 11월 기준 GitHub 스타 약 3.9만 개를 기록하고 있다.

## 주요 특징

- **대규모 사이트 DB:** README 기준 약 5,900개 사이트를 지원한다. 기본 실행 시에는 트래픽 순위 상위 500개만 검사하고, `-a` 옵션을 주면 전체를 검사한다.
- **프로필 정보 추출:** 계정 유무만 보는 데서 그치지 않고, 프로필 페이지와 사이트 API에서 실명, 소개글, 다른 계정 링크 등 가능한 정보를 뽑아낸다.
- **재귀 검색:** 이 도구의 핵심이다. 예를 들어 GitHub 프로필에서 트위터 링크를 발견하면, 거기서 찾은 새 아이디로 다시 검색을 이어 간다. 몇 단계만 거쳐도 하나의 닉네임에서 여러 플랫폼에 걸친 신원 네트워크가 그려진다.
- **태그 필터링:** 사이트 카테고리(코딩, 사진, 데이트 등)나 국가 태그로 검색 범위를 좁힐 수 있다.
- **DB 자동 업데이트:** 실행 시 하루 한 번 GitHub에서 최신 사이트 DB를 받아 오고, 오프라인이면 내장 DB를 쓴다.
- **다양한 리포트:** HTML, PDF, XMind, JSON, CSV, TXT, D3 그래프, Neo4j Cypher 스크립트까지 출력할 수 있다.
- **Tor/I2P/프록시 지원, 차단·캡차 탐지 및 일부 우회, 내장 웹 UI, 선택형 AI 요약 기능(`--ai`)도 제공한다.**

## Sherlock과 무엇이 다른가?

| 구분 | Sherlock | Maigret |
|---|---|---|
| 목적 | 계정 존재 여부 빠른 확인 | 계정 확인 + 프로필 정보 수집 |
| 재귀 검색 | 없음 | 있음 (발견한 ID로 추가 검색) |
| 리포트 | 주로 텍스트/CSV | HTML, PDF, XMind, 그래프 등 |
| 적합한 상황 | "이 아이디 어디 있지?" 수준 | 한 대상에 대한 종합 조사 |

간단히 말해, 존재 여부만 빠르게 보고 싶다면 Sherlock, 깊이 있는 조사가 필요하다면 Maigret이 어울린다.

## 설치 방법

Python 3.10 이상이 필요하다(공식 문서는 3.11을 권장).

### pip로 설치 (가장 간단)

```bash
pip install maigret
maigret YOUR_USERNAME
```

> 💡 시스템 파이썬을 더럽히고 싶지 않다면 가상환경을 먼저 만드는 것을 추천한다.

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install maigret
```

PDF 리포트는 선택 기능이라 따로 설치해야 한다. Linux/macOS에서는 cairo 같은 시스템 그래픽 라이브러리가 먼저 깔려 있어야 빌드가 된다.

```bash
pip install 'maigret[pdf]'
```

### 소스에서 설치

```bash
git clone https://github.com/soxoj/maigret && cd maigret
pip3 install .
```

### Docker

```bash
# CLI
docker pull soxoj/maigret
docker run -v /mydir:/app/reports soxoj/maigret:latest username --html

# 웹 UI (http://localhost:5000)
docker run -p 5000:5000 soxoj/maigret:web
```

이 밖에도 Windows용 단독 실행 파일(`maigret_standalone.exe`), Linux Snap 패키지, Google Cloud Shell·Colab 같은 클라우드 환경에서도 실행할 수 있다.

## 기본 사용법과 주요 옵션

### 기본 검색

```bash
maigret 닉네임
```

상위 500개 사이트를 검사하고 결과를 터미널에 보여 준다.

### 리포트 생성

```bash
maigret 닉네임 --html        # HTML 리포트
maigret 닉네임 --pdf         # PDF 리포트 (maigret[pdf] 필요)
maigret 닉네임 --json ndjson # 기계 처리용 JSON
maigret 닉네임 --csv
maigret 닉네임 --graph       # 인터랙티브 관계 그래프
```

### 범위 조절

```bash
# 전체 사이트 검사
maigret 닉네임 -a

# 특정 카테고리만 (예: 코딩 관련 사이트)
maigret 닉네임 --tags coding

# 여러 닉네임 동시 검사
maigret user1 user2 user3
```

### 알아 두면 좋은 옵션

- `--parse URL`: 특정 프로필 페이지를 파싱해 ID와 사용자명을 뽑고, 그걸로 재귀 검색을 시작한다.
- `--permute`: 두 개 이상의 입력으로 그럴듯한 닉네임 변형을 만들어 함께 검색한다(예: john doe → johndoe, j.doe 등).
- `--timeout`, `--max-connections`: 네트워크 환경에 맞게 속도와 안정성을 조절한다.
- `--web 5000`: 브라우저에서 결과를 그래프로 보고 리포트를 내려받을 수 있는 웹 UI를 띄운다.

전체 옵션은 `maigret --help` 또는 [공식 문서](https://maigret.readthedocs.io/)에서 확인할 수 있다.

## 파이썬 라이브러리로 활용하기

Maigret의 CLI는 사실 비동기(async) 파이썬 함수를 얇게 감싼 래퍼다. 그래서 내 프로젝트에 직접 import해서 쓸 수 있다. 공식 문서의 예제를 바탕으로, pip로 설치한 환경에서도 DB 경로를 찾을 수 있게 조금 손본 버전이다.

```python
import asyncio
import logging
import os

import maigret
from maigret import search as maigret_search
from maigret.sites import MaigretDatabase

# 패키지에 포함된 사이트 DB 경로
db_path = os.path.join(os.path.dirname(maigret.__file__), "resources", "data.json")
db = MaigretDatabase().load_from_path(db_path)

# CLI와 동일한 방식으로 상위 200개 '코딩' 태그 사이트 선택
sites = db.ranked_sites_dict(top=200, tags=["coding"])

results = asyncio.run(
    maigret_search(
        username="my_nickname",
        site_dict=sites,
        logger=logging.getLogger("maigret"),
        timeout=30,
    )
)

for site_name, r in results.items():
    if r["status"].is_found():
        print(f"[+] {site_name}: {r['url_user']}")
```

FastAPI, aiohttp, 디스코드 봇처럼 이미 이벤트 루프가 돌고 있는 환경이라면 `asyncio.run` 대신 `await maigret_search(...)`로 호출하면 된다. 프록시나 Tor도 `proxy=`, `tor_proxy=` 같은 키워드 인자로 넘길 수 있다.

> ⚠️ 라이브러리 API는 버전에 따라 바뀔 수 있으니, 실제로 쓰기 전에 [Library usage](https://maigret.readthedocs.io/en/latest/library-usage.html) 문서를 한 번 확인하자.

## 보안 관점에서의 활용 사례

### 1. 내 디지털 발자국 점검 (가장 추천)

가장 손쉽고 확실하게 합법적인 활용법은 나 자신을 검색해 보는 것이다. 오래전 가입하고 잊어버린 계정, 실명이나 위치가 드러나는 프로필, 서로 연결되는 계정 링크를 찾아낼 수 있다. 결과를 보고 안 쓰는 계정은 탈퇴하고, 업무용과 개인용 닉네임을 분리하는 계기로 삼으면 좋다.

### 2. 조직의 공격 표면 관리

허가를 받은 범위에서, 회사 공식 계정명이나 브랜드명이 어떤 플랫폼에 등록되어 있는지 확인할 수 있다. 사칭 계정을 발견하거나, 아직 선점하지 않은 플랫폼을 파악하는 데 쓸모 있다.

### 3. 위협 인텔리전스와 사고 대응

침해사고 분석 중 발견된 공격자 핸들, 피싱 사이트에 남은 운영자 닉네임 등을 단서로 관련 활동을 추적하는 데 쓰인다. 실제로 여러 상용 OSINT 플랫폼이 Maigret을 엔진으로 활용하고 있다.

### 4. 승인된 모의해킹·레드팀 정찰

사회공학 시나리오의 정찰 단계에서, 계약서로 범위가 명시된 대상에 한해 사용한다.

## 주의사항: 법과 윤리

Maigret은 강력한 만큼 오용 위험도 크다. 개발자도 README에서 교육 및 합법적인 목적으로만 사용하라고 명시하고, GDPR·CCPA 등 관할 지역 법률 준수 책임은 사용자에게 있다고 밝히고 있다.

국내에서는 개인정보 보호법 등과 관련될 수 있으므로 다음을 지키자.

- 본인 또는 명시적 허가를 받은 대상에만 사용한다. 지인이나 특정 개인을 몰래 조사하는 용도는 스토킹·괴롭힘으로 이어질 수 있고, 법적 책임이 따를 수 있다.
- 수집한 결과를 공개하거나 유포하지 않는다. 블로그에 예시를 올릴 때도 본인 계정이나 테스트 계정을 쓰자.
- 오탐(false positive)을 염두에 둔다. 같은 닉네임이라고 같은 사람이라는 보장은 없다. 흔한 닉네임일수록 무관한 계정이 섞이며, 사이트 구조 변경으로 결과가 틀리는 경우도 있다. 결과는 "단서"일 뿐 "증거"가 아니다.
- 대상 사이트에 과도한 요청을 보내지 않는다. 동시 접속 수와 타임아웃을 적절히 조절하자.

## 마치며

Maigret은 `pip install` 한 줄로 시작할 수 있으면서도, 재귀 검색과 풍부한 리포트 덕분에 실무 수준의 OSINT 조사까지 소화하는 도구다. 공격자 입장에서 쓸 수 있는 도구라는 건, 방어자 입장에서도 "공격자가 나에 대해 무엇을 알아낼 수 있는가"를 미리 확인할 수 있다는 뜻이기도 하다.

오늘 바로 자기 닉네임으로 한번 돌려 보자. 생각보다 많은 것이 나올 수도 있다.

## 참고 자료

- [GitHub](https://github.com/soxoj/maigret)
- [공식 문서](https://maigret.readthedocs.io/)
- [라이브러리 사용법](https://maigret.readthedocs.io/en/latest/library-usage.html)
