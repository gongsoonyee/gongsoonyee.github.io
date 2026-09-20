---
layout: post
title: "GitHub Pages에 무료 도메인 달기: is-a.dev 등록 후기"
date: 2026-09-20 12:00:00 +0900
categories: [ Development ]
tags: [ GitHub Pages, 도메인, is-a.dev, 블로그 ]
---

2026년 9월 20일 · @gongsoonyee

GitHub Pages 기본 주소(username.github.io)도 나쁘진 않지만, 좀 더 개발자다운 주소가 갖고 싶었다. 찾아보니 **is-a.dev**라는 곳에서 이름.is-a.dev 형태의 서브도메인을 무료로 받을 수 있었다. 9월 20일에 신청해서 실제로 적용까지 해봤는데, 생각보다 간단해서 정리해둔다.

## is-a.dev가 뭔데?

개발자들이 개인 사이트나 프로젝트용 서브도메인을 무료로 등록할 수 있게 해주는 오픈소스 프로젝트다. 신청은 전부 GitHub에서 PR로 진행되고, DNS는 Cloudflare에서 관리된다. 별도의 회원가입이나 결제 없이 GitHub 계정만 있으면 된다.

## 등록 방법

### 1. 저장소 포크하기

[is-a-dev/register](https://github.com/is-a-dev/register) 저장소를 내 계정으로 포크한다.

### 2. 원하는 이름이 비어있는지 확인

`domains/` 폴더에 원하는 이름의 파일이 이미 있으면 다른 사람이 먼저 쓰고 있는 것이다. 아직 아무도 안 쓴 이름이라면 내 것으로 신청할 수 있다.

### 3. 도메인 파일 만들기

`domains/원하는이름.json` 파일을 만들고 아래처럼 작성한다. GitHub Pages에 연결할 거라면 CNAME에 내 github.io 주소를 넣으면 된다.

```json
{
  "owner": {
    "username": "내깃헙아이디",
    "email": "내이메일@example.com"
  },
  "record": {
    "CNAME": "내깃헙아이디.github.io"
  }
}
```

### 4. PR 올리기

PR을 생성하면 템플릿이 나오는데, 체크리스트 항목을 전부 체크하고 세부 내용을 채워서 올린다.

### 5. 검증 → 승인 → 머지

봇이 파일 형식과 레코드를 자동으로 검증하고, 통과하면 관리자가 확인 후 승인한다. 머지되면 등록 끝! DNS 반영까지는 최대 24시간 정도 걸릴 수 있다.

## GitHub Pages에 연결하기

머지가 완료되면 내 GitHub Pages 저장소에서 **Settings → Pages → Custom domain**에 원하는이름.is-a.dev를 입력하고 저장한다. 그러면 HTTPS 인증서까지 자동으로 발급된다.
